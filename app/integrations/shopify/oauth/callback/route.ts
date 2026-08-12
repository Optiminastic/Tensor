import { type NextRequest, NextResponse } from 'next/server'

import { env } from '@/lib/env'

export const runtime = 'nodejs'

/**
 * Bridges Shopify's OAuth callback to Tensor-Core. Shopify redirects the store
 * owner's browser here (this app is on the public tunnel); the backend that
 * verifies the callback and stores the token is not, so we forward the exact
 * callback query to it and follow its redirect back into the dashboard. The
 * backend authenticates the request by its Shopify HMAC, so no user token is
 * needed - forwarding the query verbatim keeps that signature valid.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const target = `${env.TENSOR_CORE_URL}/integrations/shopify/oauth/callback${request.nextUrl.search}`
  try {
    const res = await fetch(target, { redirect: 'manual', cache: 'no-store' })
    const location = res.headers.get('location')
    if (location) {
      return NextResponse.redirect(location)
    }
  } catch {
    // fall through to the generic error redirect below
  }
  return NextResponse.redirect(new URL('/dashboard?shopify=error', env.NEXT_PUBLIC_APP_URL))
}
