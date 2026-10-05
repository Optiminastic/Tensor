'use server'

/**
 * LOCAL ONLY - gitignored, never reaches main.
 *
 * Reads the printers that could run a bed. The send itself reuses the tracked
 * queueBatchToMachineAction, which has always accepted machine_id and
 * slot_trays; only the dialog that filled them in was removed.
 */
import { resolveBackendToken } from '@/lib/backend-token'
import type { BatchQueueOptions } from '@/lib/validators/batches'
import { getBatchQueueOptions } from '@/services/batches.service'

export interface LoadResult {
  ok: boolean
  data?: BatchQueueOptions
  error?: string
}

export async function loadQueueOptions(batchId: string): Promise<LoadResult> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }
  try {
    return { ok: true, data: await getBatchQueueOptions(token, batchId) }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not read this bed’s printers.',
    }
  }
}
