import { betterAuth } from 'better-auth'
import { jwt } from 'better-auth/plugins'

import { authPool } from '@/lib/db'
import { env } from '@/lib/env'
import { fetchUserAuthz } from '@/services/authz.service'

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
  // Both the public ngrok origin and local dev are trusted, so sign-in works
  // whether the app is opened at the ngrok URL or http://localhost:3001.
  trustedOrigins: [env.NEXT_PUBLIC_APP_URL, 'http://localhost:3001'],
})

export type Session = typeof auth.$Infer.Session
