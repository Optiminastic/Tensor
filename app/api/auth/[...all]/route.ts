import { toNextJsHandler } from 'better-auth/next-js'
import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { createLogger } from '@/lib/logger'

const log = createLogger('AuthRoute')

const handlers = toNextJsHandler(auth)

/**
 * Paths closed to the public internet.
 *
 * Tensor is an internal tool: accounts are provisioned by an admin, never
 * self-served. Without this gate anyone who can reach the app can POST an email
 * and password and get an account.
 *
 * This is a route-level gate rather than Better Auth's `disableSignUp` because
 * that option is checked *inside* the handler, so it would also refuse the
 * admin's own server-side `auth.api.signUpEmail()` call — which is how invited
 * users are created. Blocking here closes the browser door and leaves the
 * server-side door open, which is exactly the distinction we need.
 *
 * Server actions call `auth.api.*` directly and never pass through this file,
 * so they are unaffected.
 */
const PUBLICLY_CLOSED_PATHS = ['/sign-up/email'] as const

export async function POST(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url)

  if (PUBLICLY_CLOSED_PATHS.some(path => pathname.endsWith(path))) {
    log.warn({ pathname }, 'Blocked a public sign-up attempt')
    return NextResponse.json(
      { error: 'Sign-up is closed. Ask an admin to invite you.' },
      { status: 403 },
    )
  }

  return handlers.POST(request)
}

export const GET = handlers.GET
