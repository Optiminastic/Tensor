'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import { type PrintBatchResult } from '@/lib/validators/batches'
import { BatchServiceError, printBatch as printBatchCall } from '@/services/batches.service'

import type { ActionResult } from './actions'

/**
 * Sends a locked batch's sliced plate to BambuBuddy's print queue.
 *
 * Queues, it does not start a print: BambuBuddy owns the printer connection and
 * decides when a bed actually runs, so this reports what it said rather than
 * claiming the machine started.
 *
 * A successful call can still come back with `queued: false` - the plate is in
 * the library but was not queued, most often because it was already sent. That
 * is reported to the operator verbatim rather than being treated as an error,
 * because sending again would not help.
 */
export async function printBatchAction(
  brand: string,
  batchId: string,
): Promise<ActionResult<PrintBatchResult>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const result = await printBatchCall(token, batchId)
    revalidatePath(`/dashboard/${brand}/production/batches`)
    revalidatePath(`/dashboard/${brand}/production/batches/${batchId}`)
    return { ok: true, data: result }
  } catch (err) {
    const message =
      err instanceof BatchServiceError ? err.message : 'Could not send the batch to the printer.'
    return { ok: false, error: message }
  }
}
