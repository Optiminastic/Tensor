import { betterAuth } from 'better-auth'
import { jwt } from 'better-auth/plugins'

import { authPool } from '@/lib/db'
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import { fetchUserAuthz } from '@/services/authz.service'

const log = createLogger('Auth')

export const auth = betterAuth({
  // Better Auth talks to Postgres directly. It owns only its own tables
  // (user, session, account, verification, jwks) — the domain lives in
  // Tensor-Core. Run `pnpm auth:migrate` to create them.
  database: authPool,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  // Rate limiting protects auth endpoints from brute-force / credential-stuffing.
  // Default storage is in-memory; for multi-instance deployments swap to a
  // distributed store (Redis/Upstash) via `rateLimit.storage = 'secondary-storage'`
  // and pass a `secondaryStorage` adapter at the top level.
  rateLimit: {
    enabled: true,
    window: 60, // seconds
    max: 100, // global default per window per IP
    customRules: {
      '/sign-in/email': { window: 60, max: 5 },
      '/sign-up/email': { window: 60, max: 5 },
      '/forget-password': { window: 60, max: 3 },
      '/reset-password': { window: 60, max: 5 },
    },
  },
  session: {
    // The session is the long-lived credential — the "refresh token" half of
    // the pair. The short-lived half is the JWT below.
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh every 24h
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  plugins: [
    jwt({
      jwt: {
        // Tensor-Core verifies both of these, so they are a contract, not decoration.
        issuer: env.BETTER_AUTH_URL,
        audience: 'tensor-core',
        // Short-lived by design: a role change propagates within this window
        // without the backend paying a database lookup on every request.
        expirationTime: '15m',
        /**
         * The claims Tensor-Core authorizes against.
         *
         * Roles and permissions come from the backend, which owns them. This
         * runs at token issuance (~every 15 min per user), not per request.
         * The token is signed with EdDSA and verified against our JWKS, so
         * these claims are trusted data, not client input.
         */
        definePayload: async ({ user, session }) => {
          const authz = await fetchUserAuthz(user.id)
          return {
            email: user.email,
            roles: authz.roles,
            permissions: authz.permissions,
            permissionsVersion: authz.permissionsVersion,
            // Lets the backend tie an action back to one device's session.
            sessionId: session.id,
          }
        },
      },
    }),
  ],
  // NEXT_PUBLIC_APP_URL covers the primary domain. Vercel Preview deployments
  // (e.g. this repo's staging branch) get a per-branch/per-deployment origin
  // that never matches it, so VERCEL_BRANCH_URL/VERCEL_URL - system env vars
  // Vercel injects automatically, no manual value needed - are trusted too.
  // Both are bare hosts (no scheme), so they're prefixed with https://.
  //
  // The two localhost ports are listed explicitly rather than relying on
  // NEXT_PUBLIC_APP_URL to happen to be one of them. It does not always point
  // at localhost: tunnelling the app through ngrok for a Shopify OAuth
  // round-trip repoints it at the public domain, and when that happened, local
  // sign-in started failing with a bare "Invalid origin" - the dev server had
  // quietly stopped being a trusted origin. 3000 is Next's default port and
  // what this repo actually runs on; 3001 is the fallback when 3000 is taken.
  trustedOrigins: [
    ...new Set([env.NEXT_PUBLIC_APP_URL, 'http://localhost:3000', 'http://localhost:3001']),
    ...(process.env.VERCEL_BRANCH_URL ? [`https://${process.env.VERCEL_BRANCH_URL}`] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ],
})

export type Session = typeof auth.$Infer.Session

/**
 * auth.api.getSession, but a thrown error is treated the same as "no
 * session" instead of crashing the page.
 *
 * getSession/getToken do their own DB-backed session validation on every
 * call - independent of and stricter than middleware's cookie-presence-only
 * check - so either can throw on an expired/invalid session or a transient
 * DB hiccup. Every server component here already handles a null session by
 * redirecting to /login; this just makes sure a thrown error reaches that
 * same handling instead of surfacing as an unhandled exception.
 */
export async function getSessionSafe(
  requestHeaders: Headers,
): Promise<Awaited<ReturnType<typeof auth.api.getSession>>> {
  return auth.api.getSession({ headers: requestHeaders }).catch((error: unknown) => {
    log.error({ err: error }, 'getSession threw; treating as unauthenticated')
    return null
  })
}

/** Same as getSessionSafe, for auth.api.getToken. */
export async function getTokenSafe(
  requestHeaders: Headers,
): Promise<Awaited<ReturnType<typeof auth.api.getToken>> | null> {
  return auth.api.getToken({ headers: requestHeaders }).catch((error: unknown) => {
    log.error({ err: error }, 'getToken threw; treating as unauthenticated')
    return null
  })
}

/** A user's display identity, for rendering "who did what" in activity views. */
export interface UserDisplay {
  id: string
  name: string | null
  email: string
}

/**
 * Resolves Better Auth user ids to their display identity (name + email).
 *
 * Identity belongs to the frontend: Better Auth owns the `user` table, while
 * Tensor-Core stores these ids only as opaque author references on the review
 * thread. This reads that one table (the sanctioned use of `authPool`) so the
 * timeline can show a name instead of a raw id. Ids with no matching user are
 * simply absent from the map, so callers can fall back gracefully.
 */
export async function getUserDirectory(ids: string[]): Promise<Map<string, UserDisplay>> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return new Map()

  const { rows } = await authPool.query(
    'SELECT id, name, email FROM "user" WHERE id = ANY($1::text[])',
    [unique],
  )
  const displays = rows as UserDisplay[]
  return new Map(displays.map(row => [row.id, row]))
}
