import { headers } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'
import {
  exchangeCode,
  isValidShopDomain,
  normaliseShopDomain,
  verifyShopifyHmac,
} from '@/lib/shopify/oauth'
import {
  encryptPending,
  PENDING_COOKIE,
  pendingCookieOptions,
  type ShopifyPending,
} from '@/lib/shopify/pending'
import { type StatePayload, verifyState } from '@/lib/shopify/state'
import { fetchBrandAssets, fetchShopProfile } from '@/services/shopify.service'

export const runtime = 'nodejs'

const STATE_COOKIE = 'shopify_oauth_state'

function redirectTo(reason: string): NextResponse {
  const res = NextResponse.redirect(
    new URL(`/create-brand?shopify=${reason}`, env.NEXT_PUBLIC_APP_URL),
  )
  res.cookies.delete(STATE_COOKIE)
  return res
}

// The state param must equal the single-use cookie, be well-signed, and the
// request must carry a valid Shopify HMAC.
function verifiedState(request: NextRequest, secret: string): StatePayload | null {
  const params = request.nextUrl.searchParams
  const stateParam = params.get('state') ?? ''
  const cookieState = request.cookies.get(STATE_COOKIE)?.value ?? ''
  if (stateParam === '' || stateParam !== cookieState) return null
  const payload = verifyState(stateParam, secret)
  if (!payload) return null
  if (!verifyShopifyHmac(params, secret)) return null
  return payload
}

interface VerifiedCallback {
  shop: string
  code: string
}

function verifyCallback(request: NextRequest, secret: string): VerifiedCallback | null {
  const payload = verifiedState(request, secret)
  if (!payload) return null

  const params = request.nextUrl.searchParams
  const shop = normaliseShopDomain(params.get('shop') ?? '')
  if (!isValidShopDomain(shop) || shop !== payload.shop) return null

  const code = params.get('code') ?? ''
  if (code === '') return null
  return { shop, code }
}

async function loadProfile(shop: string, token: string): Promise<ShopifyPending> {
  const profile = await fetchShopProfile({ shopDomain: shop, accessToken: token }).catch(() => ({
    name: '',
    description: '',
    logoUrl: null,
    shopUrl: `https://${shop}`,
  }))
  // Best-effort: the store's Brand assets (logo, slogan) from the Storefront API.
  const brand = await fetchBrandAssets(shop, token)
  return {
    shop,
    token,
    name: profile.name,
    description: brand.description || profile.description,
    logoUrl: brand.logoUrl,
    shopUrl: profile.shopUrl,
  }
}

function connectedRedirect(pending: ShopifyPending): NextResponse {
  const res = NextResponse.redirect(
    new URL('/create-brand?shopify=connected', env.NEXT_PUBLIC_APP_URL),
  )
  res.cookies.set(PENDING_COOKIE, encryptPending(pending), pendingCookieOptions())
  res.cookies.delete(STATE_COOKIE)
  return res
}

/**
 * Finishes the Shopify OAuth flow. Verifies the state cookie and Shopify's HMAC,
 * exchanges the code for an offline token, pulls the shop profile, and stashes
 * the token (encrypted, httpOnly) for the create-brand step. The token never
 * reaches client JS.
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
  if (!clientId || !secret) return redirectTo('unconfigured')

  // Every failure below lands the user on the same "Shopify connection failed"
  // screen, which is right for them and useless for anyone debugging it. The
  // two causes are very different - a rejected HMAC/state means the round-trip
  // itself is wrong (wrong secret, stale cookie, replayed callback), while a
  // failed exchange means Shopify refused the code (wrong app credentials,
  // already-used code) - and telling them apart from the outside is guesswork.
  // So each is logged with its own message. Never log `secret`, the `code`, or
  // the resulting token: the shop domain is enough to correlate.
  const verified = verifyCallback(request, secret)
  if (!verified) {
    logger.warn(
      { shop: request.nextUrl.searchParams.get('shop') },
      'shopify oauth callback rejected: bad HMAC or state mismatch',
    )
    return redirectTo('error')
  }

  let token: string
  try {
    token = await exchangeCode({
      shop: verified.shop,
      clientId,
      clientSecret: secret,
      code: verified.code,
    })
  } catch (err) {
    logger.warn(
      { shop: verified.shop, err: err instanceof Error ? err.message : String(err) },
      'shopify oauth callback: code exchange failed',
    )
    return redirectTo('error')
  }

  return connectedRedirect(await loadProfile(verified.shop, token))
}
