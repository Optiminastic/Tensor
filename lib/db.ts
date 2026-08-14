import { Pool } from 'pg'

import { env } from '@/lib/env'

/**
 * Postgres pool for Better Auth.
 *
 * This is the frontend's *only* database access, and it exists solely so
 * Better Auth can persist its own tables (user, session, account,
 * verification, jwks). Everything else — costing, pricing, RBAC, audit —
 * belongs to Tensor-Core and is reached over HTTP through `services/`.
 *
 * Do not add application queries here. If the frontend needs domain data,
 * that is a backend endpoint, not a query.
 */
const globalForDb = globalThis as unknown as {
  authPool: Pool | undefined
}

export const authPool: Pool =
  globalForDb.authPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    // Serverless/dev hot-reload friendly: keep the pool small and let idle
    // connections go, so HMR does not exhaust Postgres connection slots.
    max: 10,
    idleTimeoutMillis: 30_000,
    // Neon (serverless Postgres) auto-suspends when idle; its first connection
    // then has to wake the compute, which can take longer than a few seconds. A
    // 10s timeout was firing during that cold start, and Better Auth's failure
    // path was crashing the dev server. Give the wake room, and keep the socket
    // alive so an established connection is not dropped mid-idle.
    connectionTimeoutMillis: 30_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
  })

// Survive Next.js hot reloads in dev, which would otherwise open a new pool
// on every recompile.
if (env.NODE_ENV !== 'production') globalForDb.authPool = authPool
