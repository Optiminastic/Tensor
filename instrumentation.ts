/**
 * Next's server bootstrap hook, run once per server process.
 *
 * Kept deliberately empty of Node APIs. Turbopack compiles this file for the
 * Edge runtime as well as Node, and any direct reference to `process.on` fails
 * that compile - a runtime `if` does not help, because the failure happens
 * while the module is being built, not while it runs. The Node-only work is
 * therefore behind a dynamic import, which keeps it out of the Edge graph.
 *
 * See instrumentation-node.ts for what it installs and why.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { registerProcessGuards } = await import('./instrumentation-node')
  registerProcessGuards()
}
