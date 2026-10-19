import { getSessionCookie } from 'better-auth/cookies'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const protectedRoutes = ['/dashboard']
const authRoutes = ['/login']

/**
 * The hostname that serves customers rather than staff, e.g.
 * design.the3dprintingstore.in. Unset everywhere else, which is what keeps
 * local development and the dashboard's own domain unchanged.
 */
const customerHost = (process.env.CUSTOMER_LINK_HOST ?? '').trim().toLowerCase()

/**
 * The only two things that exist on the customer host.
 *
 * `/p/<token>` is the personalisation check and `/d/<token>` is the damage
 * form. Both are opened from a WhatsApp message by somebody with no account.
 */
const customerPaths = ['/p/', '/d/']

// Static dashboard segments that are not brand slugs (kept in sync with
// nav-config's RESERVED_SEGMENTS; inlined so the edge bundle stays light).
const reservedSegments = ['users', 'settings', 'brands', 'projects']

// Remembers the brand the admin is viewing so bare /dashboard can return to it.
// The global "all brands" sentinel ('all') is deliberately NOT a reserved segment,
// so choosing it is remembered like any brand; do not add 'all' to reservedSegments.
function rememberBrand(request: NextRequest, response: NextResponse): void {
  const segments = request.nextUrl.pathname.split('/').filter(Boolean)
  if (segments[0] !== 'dashboard') return
  const brand = segments[1]
  if (!brand || reservedSegments.includes(brand)) return
  response.cookies.set('last_brand', brand, { path: '/', httpOnly: true, sameSite: 'lax' })
}

/**
 * Nothing but the two customer pages may be reached on the customer host.
 *
 * WHY NOT A REDIRECT TO THE DASHBOARD. That host carries the SHOP'S name, so
 * bouncing a visitor from it to an internal tool's login reads as the shop
 * asking them to sign in - which is the shape of a phishing page, on the one
 * domain whose whole purpose is to look trustworthy in a WhatsApp message.
 * Staff who land here by mistake get a plain answer instead.
 */
function refuseOffCustomerHost(request: NextRequest): NextResponse | null {
  if (!customerHost) return null
  const host = (request.headers.get('host') ?? '').toLowerCase().split(':')[0]
  if (host !== customerHost) return null
  if (customerPaths.some(prefix => request.nextUrl.pathname.startsWith(prefix))) return null

  return new NextResponse(
    '<!doctype html><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>Not found</title>' +
      '<body style="font:16px/1.5 system-ui,sans-serif;margin:0;display:grid;' +
      'place-items:center;min-height:100dvh;padding:24px;color:#1a1a1a;background:#fafaf9">' +
      '<main style="max-width:28rem"><h1 style="font-size:1.25rem;margin:0 0 .5rem">' +
      'Nothing here</h1><p style="margin:0;color:#57534e">This address is only used for the ' +
      'order links we send you on WhatsApp. Open the link from your message, or reply to the ' +
      'chat and we will send you a new one.</p></main>',
    { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const offHost = refuseOffCustomerHost(request)
  if (offHost) return offHost

  const sessionCookie = getSessionCookie(request)
  const { pathname } = request.nextUrl

  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  if (isProtected && !sessionCookie) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const response = NextResponse.next()
  rememberBrand(request, response)
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
