import { headers } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { env } from '@/lib/env'
import {
  buildAuthorizeUrl,
  buildCustomAppInstallUrl,
  isValidShopDomain,
  normaliseShopDomain,
  shopFromInstallUrl,
} from '@/lib/shopify/oauth'
import { randomNonce, signState } from '@/lib/shopify/state'

export const runtime = 'nodejs'

// The signed state also lives here so the callback can prove the round-trip is
// the one this browser started (single-use).
const STATE_COOKIE = 'shopify_oauth_state'
const STATE_MAX_AGE_S = 10 * 60

function backTo(reason: string): NextResponse {
  return NextResponse.redirect(new URL(`/create-brand?shopify=${reason}`, env.NEXT_PUBLIC_APP_URL))
}

interface InstallTarget {
  url: string
  state: string
}

// A custom-distribution app installs via Shopify's pre-signed link (store baked
// into the signature); a standard app uses the /admin/oauth/authorize URL we
// build ourselves. Either way we sign and carry the same state.
function resolveTarget(
  request: NextRequest,
  clientId: string,
  secret: string,
): InstallTarget | null {
  const custom = env.SHOPIFY_CUSTOM_APP_INSTALL_URL
  const queryShop = normaliseShopDomain(request.nextUrl.searchParams.get('shop') ?? '')
  const shop = custom ? (shopFromInstallUrl(custom) ?? queryShop) : queryShop
  if (!isValidShopDomain(shop)) return null

  const state = signState({ nonce: randomNonce(), shop }, secret)
  if (custom) return { url: buildCustomAppInstallUrl(custom, state), state }

  const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/shopify/oauth/callback`
  const url = buildAuthorizeUrl({ shop, clientId, scopes: env.SHOPIFY_SCOPES, redirectUri, state })
  return { url, state }
}

/**
 * Starts the Shopify OAuth flow: validates the session and shop, sets a signed
 * state cookie, and redirects the browser to Shopify's install/consent screen.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.redirect(
      new URL('/login?callbackUrl=/create-brand', env.NEXT_PUBLIC_APP_URL),
    )
  }

  const clientId = env.SHOPIFY_API_KEY
  const secret = env.SHOPIFY_API_SECRET
  if (!clientId || !secret) return backTo('unconfigured')

  const target = resolveTarget(request, clientId, secret)
  if (!target) return backTo('invalid_shop')

  const res = NextResponse.redirect(target.url)
  res.cookies.set(STATE_COOKIE, target.state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
    maxAge: STATE_MAX_AGE_S,
  })
  return res
}
