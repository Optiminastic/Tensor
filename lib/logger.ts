import pino from 'pino'

const isDev = process.env.NODE_ENV === 'development'

/**
 * Are we inside Next's bundled server runtime?
 *
 * Next sets this to 'nodejs' or 'edge' in route handlers, server components and
 * server actions. It is unset in plain Node scripts and in tests.
 */
const inNextRuntime = Boolean(process.env.NEXT_RUNTIME)

/**
 * pino-pretty is a *transport*, which pino runs on a worker thread. That worker
 * does not survive Next's bundling: the first log from a server action kills it
 * and the failed write surfaces as
 *
 *     uncaughtException: Error: the worker has exited
 *
 * which takes the process with it. A logger that crashes the server when you
 * log is worse than no colours, so pretty printing is limited to plain Node
 * (scripts, tests) and Next gets structured JSON on stdout.
 *
 * To read it while developing, pipe it:  pnpm dev | npx pino-pretty
 */
const usePrettyTransport = isDev && !inNextRuntime

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  ...(usePrettyTransport && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'HH:MM:ss',
      },
    },
  }),
})

/**
 * Create a child logger scoped to a specific module.
 *
 * Usage:
 *   const log = createLogger('UserService')
 *   log.info({ userId }, 'User created')
 */
export function createLogger(module: string): pino.Logger {
  return logger.child({ module })
}
