import { createHmac, randomBytes } from 'node:crypto'

import { safeEqualHex } from './oauth'

// A signed, self-contained OAuth state: base64url(payload) + "." + HMAC-SHA256.
// Carried as the `state` query param AND mirrored in a cookie for single-use
// replay protection.

export interface StatePayload {
  nonce: string
  shop: string
}

export function randomNonce(): string {
  return randomBytes(16).toString('hex')
}

export function signState(payload: StatePayload, secret: string): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', secret).update(encoded).digest('hex')
  return `${encoded}.${sig}`
}

export function verifyState(state: string, secret: string): StatePayload | null {
  const dot = state.lastIndexOf('.')
  if (dot <= 0) return null
  const encoded = state.slice(0, dot)
  const sig = state.slice(dot + 1)

  const expected = createHmac('sha256', secret).update(encoded).digest('hex')
  if (!safeEqualHex(expected, sig)) return null

  try {
    const parsed: unknown = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
    if (typeof parsed !== 'object' || parsed === null) return null
    const { nonce, shop } = parsed as Record<string, unknown>
    if (typeof nonce !== 'string' || typeof shop !== 'string') return null
    return { nonce, shop }
  } catch {
    return null
  }
}
