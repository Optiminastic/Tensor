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
    ? `/dashboard/${encodeURIComponent(brand)}/integrations?shopify=${reason}`
    : `/dashboard?shopify=${reason}`
  return NextResponse.redirect(new URL(path, env.NEXT_PUBLIC_APP_URL))
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
    const callback = `/dashboard/${encodeURIComponent(brand)}/integrations`
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
  } catch {
    return backTo(brand, 'error')
  }
}
