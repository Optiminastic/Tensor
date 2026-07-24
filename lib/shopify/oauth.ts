import { createHmac, timingSafeEqual } from 'node:crypto'

// The Shopify OAuth core, ported from the ranking project's hand-rolled flow
// (no @shopify/shopify-api). Pure functions plus one token-exchange fetch.

const TOKEN_TIMEOUT_MS = 10_000

/** Normalises "store", "https://store.myshopify.com/", "admin.shopify.com/store/h" -> "store.myshopify.com". */
export function normaliseShopDomain(input: string): string {
  let host = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
  // New-style admin URL: admin.shopify.com/store/<handle>
  const adminMatch = host.match(/^admin\.shopify\.com\/store\/([a-z0-9-]+)/)
  if (adminMatch) return `${adminMatch[1]}.myshopify.com`
  host = host.replace(/\/.*$/, '') // strip any path
  if (host.endsWith('.myshopify.com')) return host
  const label = host.split('.')[0]
  return `${label}.myshopify.com`
}

/** True when the string is a well-formed <handle>.myshopify.com host. */
export function isValidShopDomain(host: string): boolean {
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(host)
}

interface BuildAuthorizeUrlParams {
  shop: string
  clientId: string
  scopes: string
  redirectUri: string
  state: string
}

/** Builds the Shopify OAuth consent URL. */
export function buildAuthorizeUrl({
  shop,
  clientId,
  scopes,
  redirectUri,
  state,
}: BuildAuthorizeUrlParams): string {
  const query = new URLSearchParams({
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    state,
  })
  return `https://${shop}/admin/oauth/authorize?${query.toString()}`
}

/**
 * Verifies Shopify's HMAC over the callback query: HMAC-SHA256 of the sorted
 * `key=value` pairs (excluding hmac/signature) with the API secret.
 */
export function verifyShopifyHmac(params: URLSearchParams, secret: string): boolean {
  const given = params.get('hmac') ?? ''
  if (given === '') return false

  const message = [...params.entries()]
    .filter(([key]) => key !== 'hmac' && key !== 'signature')
    .sort(byKey)
    .map(([key, value]) => `${key}=${value}`)
    .join('&')

  const digest = createHmac('sha256', secret).update(message).digest('hex')
  return safeEqualHex(digest, given)
}

function byKey([a]: [string, string], [b]: [string, string]): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

/** Constant-time comparison of two hex strings; false on any length/format mismatch. */
export function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))
  } catch {
    return false
  }
}

/**
 * A custom-distribution install link embeds the target store in its signed
 * payload (`permanent_domain`). Reads it so we can sign state for that store.
 */
export function shopFromInstallUrl(installUrl: string): string | null {
  try {
    const signature = new URL(installUrl).searchParams.get('signature')
    if (!signature) return null
    const encoded = signature.split('--')[0]
    const parsed: unknown = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
    const domain = (parsed as { permanent_domain?: unknown })?.permanent_domain
    return typeof domain === 'string' ? normaliseShopDomain(domain) : null
  } catch {
    return null
  }
}

/** Appends our state to a pre-signed custom-app install link and lets it redirect back. */
export function buildCustomAppInstallUrl(installUrl: string, state: string): string {
  const url = new URL(installUrl)
  url.searchParams.delete('no_redirect')
  url.searchParams.set('state', state)
  return url.toString()
}

interface ExchangeCodeParams {
  shop: string
  clientId: string
  clientSecret: string
  code: string
}

/** Exchanges the OAuth code for an offline (permanent) access token. */
export async function exchangeCode({
  shop,
  clientId,
  clientSecret,
  code,
}: ExchangeCodeParams): Promise<string> {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    cache: 'no-store',
    signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new Error(`Shopify token exchange failed (${response.status}).`)
  }
  const body: unknown = await response.json().catch(() => null)
  const token = readAccessToken(body)
  if (!token) throw new Error('Shopify did not return an access token.')
  return token
}

function readAccessToken(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null
  const token = (body as { access_token?: unknown }).access_token
  return typeof token === 'string' && token !== '' ? token : null
}
