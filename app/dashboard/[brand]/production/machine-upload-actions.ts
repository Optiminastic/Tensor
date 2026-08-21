'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import { type PrinterUploadResult, uploadToPrinter } from '@/services/machine-fleet.service'

import type { ActionResult } from './actions'

/**
 * Sends a model file to a printer's BambuBuddy library and queues it.
 *
 * The machineId argument is safe to take from the client: it only selects which
 * printer, and the backend re-checks that the machine exists and that the
 * caller holds machine:manage. It carries no identity, so a replayed payload
 * gains nothing a legitimate request would not.
 *
 * Queues, does not print. Releasing a queued file to the bed stays a deliberate
 * act in BambuBuddy.
 */
export async function uploadToPrinterAction(
  machineId: string,
  formData: FormData,
): Promise<ActionResult<PrinterUploadResult>> {
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Choose a model file to upload.' }
  }

  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }

  try {
    const result = await uploadToPrinter(token, machineId, file)
    // The machine page shows the queue this file just joined.
    revalidatePath(`/dashboard/[brand]/production/machines/[machineId]`, 'page')
    return { ok: true, data: result }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not upload the file.'
    return { ok: false, error: message }
  }
}
