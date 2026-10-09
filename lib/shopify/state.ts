import { createHmac, randomBytes } from 'node:crypto'

import { safeEqualHex } from './oauth'

// A signed, self-contained OAuth state: base64url(payload) + "." + HMAC-SHA256.
// Carried as the `state` query param AND mirrored in a cookie for single-use
// replay protection.

export interface StatePayload {
  nonce: string
  shop: string
  /**
   * The brand to attach the token to, when one already exists.
   *
   * SIGNED, not a query param, which is what makes it safe to carry: the
   * callback must be able to trust which brand it is finishing, and anything
   * in the URL can be edited on the way past. Absent for the create-brand
   * wizard, where the brand does not exist yet and the token waits in a
   * single-use cookie instead.
   */
  brand?: string
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
    return asPayload(JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')))
  } catch {
    return null
  }
}

/** Narrows a decoded state body, or rejects it. */
function asPayload(parsed: unknown): StatePayload | null {
  if (typeof parsed !== 'object' || parsed === null) return null
  const { nonce, shop, brand } = parsed as Record<string, unknown>
  if (typeof nonce !== 'string' || typeof shop !== 'string') return null
  // A brand that is present but not a string is a malformed state, not a
  // wizard one - refuse it rather than silently finishing the wrong flow.
  if (brand !== undefined && typeof brand !== 'string') return null
  return brand === undefined ? { nonce, shop } : { nonce, shop, brand }
}
