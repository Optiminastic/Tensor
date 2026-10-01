import { Pool } from 'pg'

import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

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

/**
 * REQUIRED, not defensive. Without this listener the process dies.
 *
 * node-postgres emits `error` on the pool for any IDLE client that fails, and
 * documents the consequence plainly: with no listener attached, Node raises it
 * as an uncaught exception and the process exits. Neon auto-suspends when idle
 * and drops its connections, so this fires on its own schedule - nobody has to
 * be using the app.
 *
 * In dev that process is a Next render worker. Next retires the whole worker
 * pool after two such deaths, and never recovers it:
 *
 *   Jest worker encountered 2 child process exceptions, exceeding retry limit
 *
 * From then on EVERY page returns 500 - including pages that never touch the
 * database - until the dev server is restarted by hand. The message names Jest,
 * which this project does not use, and says nothing about Postgres, which is
 * why it reads as random and cost several rounds of restarting the wrong thing.
 *
 * Logged rather than swallowed: the pool discards the broken client and hands
 * out a fresh one on the next query, so the request that follows succeeds. The
 * line is here to make a genuinely sick database visible instead of silent.
 */
authPool.on('error', (err: Error) => {
  logger.error({ module: 'AuthPool', err }, 'idle Postgres client errored; pool will reconnect')
})

// Survive Next.js hot reloads in dev, which would otherwise open a new pool
// on every recompile.
if (env.NODE_ENV !== 'production') globalForDb.authPool = authPool
