/**
 * The Node-only half of the instrumentation hook. Never bundled for Edge.
 *
 * It lives in its own file because a runtime `if` is not enough: Turbopack
 * compiles instrumentation.ts for BOTH runtimes and rejects `process.on` in the
 * Edge bundle at COMPILE time, guard or no guard - "A Node.js API is used
 * (process.on) which is not supported in the Edge Runtime. Ecmascript file had
 * an error". That failure crashes the render worker, which is the exact thing
 * this was written to prevent. A dynamic import from the Node branch keeps the
 * module out of the Edge graph entirely.
 *
 * Why any of this exists: Node 24 treats an unhandled promise rejection as
 * fatal, so one escaping a catch exits the process rather than logging. In dev
 * that process is a Next render worker, and Next retires the whole pool after
 * two deaths - "Jest worker encountered 2 child process exceptions, exceeding
 * retry limit". The pool never recovers, so every page then returns 500,
 * including healthy ones, until the dev server is restarted by hand.
 *
 * Registering a handler is what makes a rejection non-fatal: Node's
 * --unhandled-rejections=throw default applies only when nothing is listening.
 * The failure is still logged, with its stack, so a real bug stays visible.
 */
export function registerProcessGuards(): void {
  process.on('unhandledRejection', (reason: unknown) => {
    const detail =
      reason instanceof Error ? `${reason.message}\n${reason.stack ?? ''}` : String(reason)
    // console, not the pino logger: this runs outside a request, and a logger
    // failure here would be the thing that kills the worker.
    // eslint-disable-next-line no-console
    console.error('[unhandledRejection] kept the worker alive:', detail)
  })

  process.on('uncaughtException', (err: Error) => {
    // eslint-disable-next-line no-console
    console.error('[uncaughtException] kept the worker alive:', err.message, err.stack)
  })
}
