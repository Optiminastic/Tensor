'use server'

import { resolveBackendToken } from '@/lib/backend-token'
import type { FleetMachine, FleetMachineLive } from '@/lib/validators/machine-fleet'
import type { Archive } from '@/lib/validators/print-history'
import type { QueueItem } from '@/lib/validators/print-queue'
import {
  getFleetMachine,
  getFleetMachineLive,
  listFleetMachines,
  listPrintHistory,
  listPrintQueue,
  MachineFleetServiceError,
} from '@/services/machine-fleet.service'

import type { ActionResult } from './actions'

/**
 * Read-only actions behind the live-status polling.
 *
 * They exist because a client component cannot call `services/` directly - the
 * backend bearer token is resolved server-side per request - and the repo rule
 * is that data access never happens with a bare `fetch` in a component. Same
 * shape as `fetchDesignDetail`, which is what the design page polls with.
 *
 * None of them revalidate a path: these are reads on a timer, and revalidating
 * would push a full RSC re-render through on every tick, which is exactly the
 * cost the query layer exists to avoid.
 *
 * `machineId` arriving from the client is safe: it is an opaque id the backend
 * authorises with `machine:read` against the caller's own token, so it grants
 * nothing the caller could not already fetch.
 */

export async function fetchFleetMachines(): Promise<ActionResult<FleetMachine[]>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    return { ok: true, data: await listFleetMachines(token) }
  } catch (err) {
    const message =
      err instanceof MachineFleetServiceError ? err.message : 'Could not load the machines.'
    return { ok: false, error: message }
  }
}

export async function fetchFleetMachine(machineId: string): Promise<ActionResult<FleetMachine>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    return { ok: true, data: await getFleetMachine(token, machineId) }
  } catch (err) {
    const message =
      err instanceof MachineFleetServiceError ? err.message : 'Could not load the machine.'
    return { ok: false, error: message }
  }
}

/**
 * Live telemetry for one machine.
 *
 * Returns `{ ok: true, data: null }` when BambuBuddy cannot be reached - the
 * service already swallows that case. Reporting it as a failed action instead
 * would throw the polling query into an error state on every tick for a printer
 * that is merely switched off, which is a normal condition rather than a fault.
 */
export async function fetchFleetMachineLive(
  machineId: string,
): Promise<ActionResult<FleetMachineLive | null>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    return { ok: true, data: await getFleetMachineLive(token, machineId) }
  } catch (err) {
    const message =
      err instanceof MachineFleetServiceError ? err.message : 'Could not load live printer status.'
    return { ok: false, error: message }
  }
}

/** BambuBuddy's live queue and print history, each with its own failure. */
export interface PrintActivity {
  queue: QueueItem[]
  queueError: string | null
  history: Archive[]
  historyError: string | null
}

/**
 * BambuBuddy's queue and history for Machine Management, read after the page
 * has rendered.
 *
 * They go through the BambuBuddy tunnel - about 1 s for the queue and 2 s for
 * the history on prod - and the page used to wait for both before showing the
 * Machines tab, which uses neither. Read together, because they fail together.
 * Each failure is carried to its own tab rather than failing the other.
 */
export async function loadPrintActivity(): Promise<PrintActivity> {
  const { token, error } = await resolveBackendToken()
  if (!token) {
    const message = error ?? 'Your session has expired. Sign in again.'
    return { queue: [], queueError: message, history: [], historyError: message }
  }
  const [queue, history] = await Promise.allSettled([
    listPrintQueue(token),
    listPrintHistory(token),
  ])
  return {
    queue: queue.status === 'fulfilled' ? queue.value : [],
    queueError: failureOf(queue, 'Could not reach BambuBuddy to read the print queue.'),
    history: history.status === 'fulfilled' ? history.value : [],
    historyError: failureOf(history, 'Could not reach BambuBuddy to read the print history.'),
  }
}

/** A read's failure in the operator's words: the backend's own, else the fallback. */
function failureOf(result: PromiseSettledResult<unknown>, fallback: string): string | null {
  if (result.status === 'fulfilled') return null
  return result.reason instanceof MachineFleetServiceError ? result.reason.message : fallback
}
