import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

import { cookies } from 'next/headers'

import { env } from '@/lib/env'

// Holds a freshly-obtained Shopify OAuth token (plus the non-secret profile)
// between the callback and brand creation, since the connection can only be
// persisted once the brand exists. AES-256-GCM encrypted, httpOnly, short-lived.
// The callback route sets it on its redirect response; the create-brand page and
// the finalize action read/clear it via cookies().

export const PENDING_COOKIE = 'shopify_pending'
const MAX_AGE_S = 30 * 60 // 30 minutes
const IV_BYTES = 12
const TAG_BYTES = 16

export interface ShopifyPending {
  shop: string
  token: string
  name: string
  description: string
  logoUrl: string | null
  shopUrl: string
}

export interface PendingCookieOptions {
  httpOnly: true
  sameSite: 'lax'
  secure: boolean
  path: string
  maxAge: number
}

export function pendingCookieOptions(): PendingCookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_S,
  }
}

function key(): Buffer {
  const secret = env.SHOPIFY_API_SECRET
  if (!secret) throw new Error('SHOPIFY_API_SECRET is not configured.')
  return createHash('sha256').update(secret).digest()
}

export function encryptPending(payload: ShopifyPending): string {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const enc = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString('base64url')
}

export function decryptPending(blob: string): ShopifyPending | null {
  try {
    const raw = Buffer.from(blob, 'base64url')
    const iv = raw.subarray(0, IV_BYTES)
    const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES)
    const enc = raw.subarray(IV_BYTES + TAG_BYTES)
    const decipher = createDecipheriv('aes-256-gcm', key(), iv)
    decipher.setAuthTag(tag)
    const dec = Buffer.concat([decipher.update(enc), decipher.final()])
    const parsed: unknown = JSON.parse(dec.toString('utf8'))
    return isPending(parsed) ? parsed : null
  } catch {
    return null
  }
}

function isPending(value: unknown): value is ShopifyPending {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.shop === 'string' &&
    typeof v.token === 'string' &&
    typeof v.name === 'string' &&
    typeof v.description === 'string' &&
    (v.logoUrl === null || typeof v.logoUrl === 'string') &&
    typeof v.shopUrl === 'string'
  )
}

/** Reads and decrypts the pending cookie (server component or server action). */
export async function readPendingCookie(): Promise<ShopifyPending | null> {
  const store = await cookies()
  const raw = store.get(PENDING_COOKIE)?.value
  return raw ? decryptPending(raw) : null
}

/** Clears the pending cookie (server action). */
export async function clearPendingCookie(): Promise<void> {
  const store = await cookies()
  store.delete(PENDING_COOKIE)
}
