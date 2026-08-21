import { headers } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { env } from '@/lib/env'
import { buildAuthorizeUrl, isValidShopDomain, normaliseShopDomain } from '@/lib/shopify/oauth'
import { randomNonce, signState } from '@/lib/shopify/state'

export const runtime = 'nodejs'

// The signed state also lives in this cookie so the callback can prove the
// round-trip is the one this browser started (single-use CSRF defence). Must
// match the name the callback reads.
const STATE_COOKIE = 'shopify_oauth_state'
const STATE_MAX_AGE_S = 10 * 60

/** Back to the wizard, which reads `shopify` and shows a message.
 *
 * The reason strings are the ones CreateBrandPage's statusNotice understands.
 * A reason it does not recognise renders no notice at all - the browser simply
 * returns to the wizard unchanged, which is indistinguishable from the button
 * doing nothing. That silent bounce is the bug this whole route exists to fix,
 * so it must not be reintroduced here. */
function backToWizard(reason: string): NextResponse {
  return NextResponse.redirect(new URL(`/create-brand?shopify=${reason}`, env.NEXT_PUBLIC_APP_URL))
}

/**
 * Starts the Shopify OAuth flow for the create-brand wizard, where no brand
 * exists yet.
 *
 * This is the missing half of a flow that was already half-built: the callback
 * at /api/shopify/oauth/callback verifies a `shopify_oauth_state` cookie,
 * exchanges the code and stashes the token for finalizeShopifyConnection to
 * attach once the brand is created - but nothing ever set that cookie, so the
 * flow could not be started at all. The wizard was pointed at
 * /api/shopify/oauth/install instead, which requires a brand that by
 * definition does not exist yet, and bounced straight back with
 * `invalid_request`.
 *
 * Deliberately distinct from that route, not a widening of it. The two flows
 * differ in where trust lives: /install asks Tensor-Core to sign a state
 * binding the callback to an EXISTING brand, which is what makes a token land
 * on the right brand. Here there is no brand to bind, so the state carries only
 * a nonce and the shop, the token is held in an encrypted single-use cookie,
 * and it is attached to the brand at the moment the brand is created. Merging
 * them would mean weakening the brand binding for the case that has one.
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
  if (!clientId || !secret) return backToWizard('unconfigured')

  // Accepts what an admin actually pastes - "store", the storefront URL, or the
  // new-style admin.shopify.com/store/<handle> - and normalises it before the
  // validity check, so a legitimate store is not rejected over its format.
  const shop = normaliseShopDomain(request.nextUrl.searchParams.get('shop') ?? '')
  if (!isValidShopDomain(shop)) return backToWizard('invalid_shop')

  const state = signState({ nonce: randomNonce(), shop }, secret)
  const url = buildAuthorizeUrl({
    shop,
    clientId,
    scopes: env.SHOPIFY_SCOPES,
    // Must match the Allowed redirection URL configured in the Shopify app.
    redirectUri: `${env.NEXT_PUBLIC_APP_URL}/api/shopify/oauth/callback`,
    state,
  })

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
