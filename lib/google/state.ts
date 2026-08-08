import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

import type { GoogleProvider } from './oauth'

// A signed, self-contained OAuth state: base64url(payload) + "." + HMAC-SHA256.
// Carried as the `state` query param AND mirrored in a cookie, so the callback
// can prove the round-trip is the one this browser started (single-use CSRF
// defence). The payload also carries which brand + provider to connect, since
// Google's callback - unlike Shopify's - does not echo those back.

export interface GoogleStatePayload {
  nonce: string
  brand: string
  provider: GoogleProvider
}

export function randomNonce(): string {
  return randomBytes(16).toString('hex')
}

/** Constant-time comparison of two hex strings; false on any length/format mismatch. */
function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))
  } catch {
    return false
  }
}

export function signState(payload: GoogleStatePayload, secret: string): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', secret).update(encoded).digest('hex')
  return `${encoded}.${sig}`
}

export function verifyState(state: string, secret: string): GoogleStatePayload | null {
  const dot = state.lastIndexOf('.')
  if (dot <= 0) return null
  const encoded = state.slice(0, dot)
  const sig = state.slice(dot + 1)

  const expected = createHmac('sha256', secret).update(encoded).digest('hex')
  if (!safeEqualHex(expected, sig)) return null

  try {
    const parsed: unknown = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
    if (typeof parsed !== 'object' || parsed === null) return null
    const { nonce, brand, provider } = parsed as Record<string, unknown>
    if (typeof nonce !== 'string' || typeof brand !== 'string') return null
    if (provider !== 'google_ads' && provider !== 'google_analytics') return null
    return { nonce, brand, provider }
  } catch {
    return null
  }
}
