import { headers } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { env } from '@/lib/env'
import { exchangeCode, fetchAccountEmail } from '@/lib/google/oauth'
import { type GoogleStatePayload, verifyState } from '@/lib/google/state'
import { upsertConnection } from '@/services/connections.service'

export const runtime = 'nodejs'

const STATE_COOKIE = 'google_oauth_state'

function redirectTo(brand: string, reason: string): NextResponse {
  const path = brand
    ? `/dashboard/${encodeURIComponent(brand)}/integrations?google=${reason}`
    : `/dashboard?google=${reason}`
  const res = NextResponse.redirect(new URL(path, env.NEXT_PUBLIC_APP_URL))
  res.cookies.delete(STATE_COOKIE)
  return res
}

// The state param must equal the single-use cookie and carry a valid signature.
function verifiedState(request: NextRequest, secret: string): GoogleStatePayload | null {
  const stateParam = request.nextUrl.searchParams.get('state') ?? ''
  const cookieState = request.cookies.get(STATE_COOKIE)?.value ?? ''
  if (stateParam === '' || stateParam !== cookieState) return null
  return verifyState(stateParam, secret)
}

// Stores the freshly-obtained tokens on the brand's connection. Runs server-side
// with the admin's bearer token; the backend enforces brand:manage. Tokens are
// written but never read back out.
async function persistConnection(
  payload: GoogleStatePayload,
  tokens: { accessToken: string; refreshToken: string | null; expiresAt: string | null },
  email: string | null,
): Promise<boolean> {
  const token = await auth.api.getToken({ headers: await headers() })
  if (!token?.token) return false
  await upsertConnection(token.token, {
    brandSlug: payload.brand,
    provider: payload.provider,
    input: {
      status: 'connected',
      external_account_id: email,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_at: tokens.expiresAt,
    },
  })
  return true
}

/**
 * Finishes the Google OAuth flow. Verifies the state cookie, exchanges the code
 * for access + refresh tokens, and persists the connection for the brand +
 * provider carried in the signed state. Tokens never reach client JS.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.redirect(new URL('/login', env.NEXT_PUBLIC_APP_URL))

  const clientId = env.GOOGLE_OAUTH_CLIENT_ID
  const secret = env.GOOGLE_OAUTH_CLIENT_SECRET
  if (!clientId || !secret) return redirectTo('', 'unconfigured')

  const payload = verifiedState(request, secret)
  if (!payload) return redirectTo('', 'error')

  const params = request.nextUrl.searchParams
  if (params.get('error')) return redirectTo(payload.brand, 'denied')
  const code = params.get('code') ?? ''
  if (code === '') return redirectTo(payload.brand, 'error')

  try {
    const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/google/oauth/callback`
    const tokens = await exchangeCode({ clientId, clientSecret: secret, code, redirectUri })
    const email = await fetchAccountEmail(tokens.accessToken)
    if (!(await persistConnection(payload, tokens, email))) {
      return redirectTo(payload.brand, 'error')
    }
  } catch {
    return redirectTo(payload.brand, 'error')
  }

  return redirectTo(payload.brand, 'connected')
}
