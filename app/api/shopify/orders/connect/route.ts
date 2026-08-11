import { headers } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

import { getSessionSafe, getTokenSafe } from '@/lib/auth'
import { env } from '@/lib/env'

export const runtime = 'nodejs'

// Where to send the browser back when the flow cannot even start (before
// Tensor-Core has a chance to redirect to its own brand-aware target - see
// shopifyIntegrationsURL in internal/httpapi/shopify_oauth.go).
function backTo(brand: string, reason: string): NextResponse {
  const path = brand
    ? `/dashboard/${encodeURIComponent(brand)}/integrations?shopify_orders=${reason}`
    : `/dashboard?shopify_orders=${reason}`
  return NextResponse.redirect(new URL(path, env.NEXT_PUBLIC_APP_URL))
}

function loginRedirect(brand: string): NextResponse {
  const callback = `/dashboard/${encodeURIComponent(brand)}/integrations`
  return NextResponse.redirect(
    new URL(`/login?callbackUrl=${encodeURIComponent(callback)}`, env.NEXT_PUBLIC_APP_URL),
  )
}

// Tensor-Core answers with a 302 to Shopify's consent screen on success, or a
// JSON error (not a redirect) if the shop/brand was rejected before it got
// that far - either way, relay it as this route's own redirect.
async function relayAuthorize(
  authorizeUrl: URL,
  brand: string,
  bearerToken: string,
): Promise<NextResponse> {
  let backendResponse: Response
  try {
    backendResponse = await fetch(authorizeUrl, {
      headers: { Authorization: `Bearer ${bearerToken}` },
      redirect: 'manual',
      cache: 'no-store',
    })
  } catch {
    return backTo(brand, 'error')
  }

  const location = backendResponse.headers.get('location')
  if (backendResponse.status >= 300 && backendResponse.status < 400 && location) {
    return NextResponse.redirect(location)
  }
  return backTo(brand, backendResponse.status === 422 ? 'invalid_shop' : 'error')
}

/**
 * Bridges the browser to Tensor-Core's order-import OAuth start
 * (GET /integrations/shopify/authorize), which is gated by a Bearer token -
 * something a plain <a href> or form navigation can never carry. This route
 * authenticates the request itself (same as every other server action/route
 * in this app), mints that token, and replays Tensor-Core's own redirect
 * (to Shopify's consent screen) as this route's own redirect - so the
 * browser only ever sees a normal top-level navigation chain:
 * here -> Tensor-Core -> Shopify -> Tensor-Core's callback -> back to the
 * brand's Integrations page.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams
  const brand = params.get('brand') ?? ''
  const shopDomain = params.get('shop_domain') ?? ''

  const session = await getSessionSafe(await headers())
  if (!session) return loginRedirect(brand)
  if (brand === '' || shopDomain === '') return backTo(brand, 'invalid_request')

  const token = await getTokenSafe(await headers())
  if (!token?.token) return backTo(brand, 'error')

  const authorizeUrl = new URL(`${env.TENSOR_CORE_URL}/integrations/shopify/authorize`)
  authorizeUrl.searchParams.set('brand', brand)
  authorizeUrl.searchParams.set('shop_domain', shopDomain)

  return relayAuthorize(authorizeUrl, brand, token.token)
}
