'use server'

import { resolveBackendToken } from '@/lib/backend-token'
import type { FleetMachine, FleetMachineLive } from '@/lib/validators/machine-fleet'
import {
  getFleetMachine,
  getFleetMachineLive,
  listFleetMachines,
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
