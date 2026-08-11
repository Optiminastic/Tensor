import { getSessionCookie } from 'better-auth/cookies'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const protectedRoutes = ['/dashboard']
const authRoutes = ['/login']

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

export async function middleware(request: NextRequest): Promise<NextResponse> {
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
