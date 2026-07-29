// The Google OAuth 2.0 core, shared by Google Ads and Google Analytics. Both use
// the same authorize + token endpoints and differ only by scope, so one flow
// serves both, parameterised by provider. Pure functions plus the two fetches
// (token exchange, userinfo). No @google-cloud/* dependency.

const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo'
const TOKEN_TIMEOUT_MS = 10_000
const USERINFO_TIMEOUT_MS = 5_000

// The Google providers this flow can connect. A subset of ConnectionProvider;
// kept here so the OAuth core does not depend on the connections validator.
export type GoogleProvider = 'google_ads' | 'google_analytics'

const GOOGLE_PROVIDERS: Record<GoogleProvider, true> = {
  google_ads: true,
  google_analytics: true,
}

/** Narrows an arbitrary string to a GoogleProvider. */
export function isGoogleProvider(value: string): value is GoogleProvider {
  return Object.prototype.hasOwnProperty.call(GOOGLE_PROVIDERS, value)
}

// The API scope each provider needs, on top of the identity scopes below. Ads
// needs full adwords; Analytics only reads report data.
const PROVIDER_SCOPES: Record<GoogleProvider, string> = {
  google_ads: 'https://www.googleapis.com/auth/adwords',
  google_analytics: 'https://www.googleapis.com/auth/analytics.readonly',
}

// openid + email let us read the connected Google account's address for the
// connection's external_account_id, so an admin can see whose account it is.
const IDENTITY_SCOPES = 'openid email'

/** The space-separated scope string for a provider's consent screen. */
export function scopesFor(provider: GoogleProvider): string {
  return `${IDENTITY_SCOPES} ${PROVIDER_SCOPES[provider]}`
}

interface BuildAuthorizeUrlParams {
  clientId: string
  redirectUri: string
  scope: string
  state: string
}

/**
 * Builds Google's consent URL. `access_type=offline` + `prompt=consent` force a
 * refresh token every time (Google omits it on re-consent otherwise), which the
 * backend needs to call the API long after the access token expires.
 */
export function buildAuthorizeUrl({
  clientId,
  redirectUri,
  scope,
  state,
}: BuildAuthorizeUrlParams): string {
  const query = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    state,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
  })
  return `${AUTHORIZE_URL}?${query.toString()}`
}

export interface GoogleTokens {
  accessToken: string
  refreshToken: string | null
  expiresAt: string | null // ISO 8601, from expires_in seconds
}

interface ExchangeCodeParams {
  clientId: string
  clientSecret: string
  code: string
  redirectUri: string
}

/** Exchanges the authorization code for access + refresh tokens. */
export async function exchangeCode({
  clientId,
  clientSecret,
  code,
  redirectUri,
}: ExchangeCodeParams): Promise<GoogleTokens> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new Error(`Google token exchange failed (${response.status}).`)
  }
  const body: unknown = await response.json().catch(() => null)
  return readTokens(body)
}

function readTokens(body: unknown): GoogleTokens {
  if (typeof body !== 'object' || body === null) {
    throw new Error('Google did not return a token payload.')
  }
  const b = body as Record<string, unknown>
  const accessToken = typeof b.access_token === 'string' ? b.access_token : ''
  if (accessToken === '') throw new Error('Google did not return an access token.')
  const refreshToken = typeof b.refresh_token === 'string' ? b.refresh_token : null
  const expiresAt =
    typeof b.expires_in === 'number' && b.expires_in > 0
      ? new Date(Date.now() + b.expires_in * 1000).toISOString()
      : null
  return { accessToken, refreshToken, expiresAt }
}

/**
 * Best-effort read of the connected account's email (from the openid/email
 * scope), used as the connection's external_account_id. Returns null on any
 * failure - a missing label must never fail an otherwise-good connection.
 */
export async function fetchAccountEmail(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(USERINFO_TIMEOUT_MS),
    })
    if (!response.ok) return null
    const body: unknown = await response.json().catch(() => null)
    if (typeof body !== 'object' || body === null) return null
    const email = (body as { email?: unknown }).email
    return typeof email === 'string' && email !== '' ? email : null
  } catch {
    return null
  }
}
