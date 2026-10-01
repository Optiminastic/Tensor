/**
 * Keeps a stray rejected promise from killing the render worker.
 *
 * Node 15+ treats an unhandled rejection as fatal, and Node 24 is what runs
 * here. A single uncaught rejection therefore does not merely log - it exits
 * the process. In dev that process is one of Next's render workers, and Next
 * retires the whole pool after two such deaths: "Jest worker encountered 2
 * child process exceptions, exceeding retry limit". The pool never recovers,
 * so from then on EVERY page returns 500, including pages that are perfectly
 * healthy, until the dev server is restarted by hand.
 *
 * What triggers it here is the backend going away. Tensor-Core is a separate
 * process on :8001; when it stops, every server-side fetch rejects, and it
 * only takes one of those to escape a catch for the worker to die. The symptom
 * points at Jest, which this project does not use, and says nothing about the
 * backend - which is why it reads as random and cost several debugging rounds.
 *
 * Registering a handler is what makes the rejection non-fatal: Node's
 * --unhandled-rejections=throw default applies only when nothing is listening.
 * The request still fails and still logs; it just fails as one bad request
 * instead of taking the server down with it.
 *
 * Deliberately not a place to swallow errors quietly - the reason is logged
 * with its stack, so a genuine bug is still visible in the terminal.
 */
export function register(): void {
  // Node only. This hook also runs in the Edge runtime, where process.on does
  // not exist and merely referencing it fails the build.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  process.on('unhandledRejection', (reason: unknown) => {
    const detail =
      reason instanceof Error ? `${reason.message}\n${reason.stack ?? ''}` : String(reason)
    // console, not the pino logger: this runs before/outside a request, and a
    // logger failure here would be the thing that kills the worker.
    // eslint-disable-next-line no-console
    console.error('[unhandledRejection] kept the worker alive:', detail)
  })

  process.on('uncaughtException', (err: Error) => {
    // eslint-disable-next-line no-console
    console.error('[uncaughtException] kept the worker alive:', err.message, err.stack)
  })
}
