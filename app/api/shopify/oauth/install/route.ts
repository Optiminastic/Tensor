import { headers } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

import { auth, getTokenSafe } from '@/lib/auth'
import { env } from '@/lib/env'
import { getShopifyAuthorizeUrl } from '@/services/connections.service'

export const runtime = 'nodejs'

// Where to send the browser back when the flow cannot start. The Integrations
// page reads the `shopify` status param and shows a message.
function backTo(brand: string, reason: string): NextResponse {
  const path = brand
    ? `/dashboard/settings/integrations?brand=${encodeURIComponent(brand)}&shopify=${reason}`
    : `/dashboard?shopify=${reason}`
  return NextResponse.redirect(new URL(path, env.NEXT_PUBLIC_APP_URL))
}

/**
 * Why the authorize call failed, as a status the page can speak about.
 *
 * The reason is NOT swallowed. This used to catch everything into 'error',
 * whose message says "please try again" - and the commonest failure here is
 * that the backend has no authorize route at all, which retrying will never
 * fix. That one gets its own status so the page can point at the token field
 * instead of sending somebody round the same loop.
 */
function reasonFor(cause: unknown): string {
  const message = cause instanceof Error ? cause.message : String(cause)
  const missing = message.includes('404') || message.toLowerCase().includes('not found')
  return missing ? 'unavailable' : 'error'
}

/**
 * Starts the Shopify OAuth connect for one brand's store: validates the session,
 * asks Tensor-Core (with the admin's token) for the authorize URL, and redirects
 * the browser to Shopify's consent screen. The backend callback finishes the
 * connect and stores the brand's Shopify token, so publishing needs no per-store
 * app.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams
  const brand = params.get('brand') ?? ''
  const shop = (params.get('shop') ?? '').trim().toLowerCase()

  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session) {
    const callback = `/dashboard/settings/integrations?brand=${encodeURIComponent(brand)}`
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(callback)}`, env.NEXT_PUBLIC_APP_URL),
    )
  }
  if (brand === '' || shop === '') {
    return backTo(brand, 'invalid_request')
  }

  const token = await getTokenSafe(requestHeaders)
  if (!token?.token) {
    return backTo(brand, 'error')
  }
  try {
    const authorizeUrl = await getShopifyAuthorizeUrl(token.token, brand, shop)
    return NextResponse.redirect(authorizeUrl)
  } catch (cause) {
    return backTo(brand, reasonFor(cause))
  }
}
