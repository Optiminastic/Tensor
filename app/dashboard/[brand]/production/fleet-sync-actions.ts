'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import { type FleetSyncResult } from '@/lib/validators/machine-fleet'
import {
  MachineFleetServiceError,
  syncFleetMachines as syncFleetMachinesCall,
} from '@/services/machine-fleet.service'

import type { ActionResult } from './actions'

/**
 * Reconciles Machine Management with the printers BambuBuddy reports.
 *
 * This is the only thing that populates the fleet - nothing syncs on a timer or
 * at startup - so on a fresh deployment the machines page stays empty until
 * someone runs this. That is deliberate (a background poll against a printer
 * host that may be asleep is worse), but it does mean the page needs a way to
 * trigger it, which is what this backs.
 */
export async function syncFleetAction(brand: string): Promise<ActionResult<FleetSyncResult>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const result = await syncFleetMachinesCall(token)
    revalidatePath(`/dashboard/${brand}/production/machines`)
    return { ok: true, data: result }
  } catch (err) {
    const message =
      err instanceof MachineFleetServiceError
        ? err.message
        : 'Could not reach BambuBuddy to sync the fleet.'
    return { ok: false, error: message }
  }
}
