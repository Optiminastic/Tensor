import { headers } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { env } from '@/lib/env'
import { buildAuthorizeUrl, isGoogleProvider, scopesFor } from '@/lib/google/oauth'
import { randomNonce, signState } from '@/lib/google/state'

export const runtime = 'nodejs'

// The signed state also lives in this cookie so the callback can prove the
// round-trip is the one this browser started (single-use CSRF defence).
const STATE_COOKIE = 'google_oauth_state'
const STATE_MAX_AGE_S = 10 * 60

// Where to send the browser back when the flow cannot start. The Integrations
// page reads the `google` status param and shows a message.
function backTo(brand: string, reason: string): NextResponse {
  const path = brand
    ? `/dashboard/${encodeURIComponent(brand)}/integrations?google=${reason}`
    : `/dashboard?google=${reason}`
  return NextResponse.redirect(new URL(path, env.NEXT_PUBLIC_APP_URL))
}

/**
 * Starts the Google OAuth flow for one brand + provider (Ads or Analytics):
 * validates the session and inputs, sets a signed state cookie, and redirects
 * the browser to Google's consent screen.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams
  const brand = params.get('brand') ?? ''
  const provider = params.get('provider') ?? ''

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    const callback = `/dashboard/${encodeURIComponent(brand)}/integrations`
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(callback)}`, env.NEXT_PUBLIC_APP_URL),
    )
  }

  const clientId = env.GOOGLE_OAUTH_CLIENT_ID
  const secret = env.GOOGLE_OAUTH_CLIENT_SECRET
  if (!clientId || !secret) return backTo(brand, 'unconfigured')
  if (brand === '' || !isGoogleProvider(provider)) return backTo(brand, 'invalid_request')

  const state = signState({ nonce: randomNonce(), brand, provider }, secret)
  const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/google/oauth/callback`
  const url = buildAuthorizeUrl({ clientId, redirectUri, scope: scopesFor(provider), state })

  const res = NextResponse.redirect(url)
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
    maxAge: STATE_MAX_AGE_S,
  })
  return res
}
