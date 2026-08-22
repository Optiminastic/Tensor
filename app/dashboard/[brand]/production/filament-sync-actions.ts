'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import { type FilamentSyncResult } from '@/lib/validators/production'
import { ProductionServiceError, syncFilamentFromBambuBuddy } from '@/services/production.service'

import type { ActionResult } from './actions'

/**
 * Mirrors BambuBuddy's spool shelf into Tensor's filament inventory.
 *
 * Manual, like the fleet sync and for the same reason: BambuBuddy runs on a
 * laptop reached over a VPN, so a background poll would fail routinely whenever
 * it sleeps, and a filament shelf changes when someone physically adds a spool
 * rather than continuously.
 *
 * It overwrites Tensor's stock figures with BambuBuddy's. That is the point -
 * BambuBuddy is where spools are scanned and weighed - but it does mean a
 * Tensor-side debit not yet reflected there is lost, so this is an action
 * someone takes rather than something that happens quietly.
 */
export async function syncFilamentAction(brand: string): Promise<ActionResult<FilamentSyncResult>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const result = await syncFilamentFromBambuBuddy(token)
    revalidatePath(`/dashboard/${brand}/production/inventory`)
    return { ok: true, data: result }
  } catch (err) {
    const message =
      err instanceof ProductionServiceError
        ? err.message
        : 'Could not reach BambuBuddy to sync filament.'
    return { ok: false, error: message }
  }
}
