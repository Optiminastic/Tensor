'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import { ProductionServiceError, uploadJobModel } from '@/services/production.service'

import type { ActionResult } from './actions'

/**
 * Attaches a model file to a job that Tensor cannot build itself.
 *
 * Every product except the Dual Name Plank needs a person to supply the
 * geometry: a plank is rendered from the customer's own two names, everything
 * else waits for a file. Attaching one clears the job's `stl_missing` and lets
 * it into batching, so this is the approval step as much as an upload.
 *
 * FormData rather than typed arguments because a File cannot cross the server
 * action boundary any other way.
 */
export async function uploadJobModelAction(
  jobId: string,
  form: FormData,
): Promise<ActionResult<{ printFileId: string | null }>> {
  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Choose a model file to upload.' }
  }

  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }

  try {
    const job = await uploadJobModel(token, jobId, file)
    // The job's own page and the queue both show whether it has a model.
    revalidatePath('/dashboard/[brand]/production/jobs', 'page')
    revalidatePath(`/dashboard/[brand]/production/jobs/${jobId}`, 'page')
    return { ok: true, data: { printFileId: job.print_file_id ?? null } }
  } catch (err) {
    const message =
      err instanceof ProductionServiceError ? err.message : 'Could not upload the model file.'
    return { ok: false, error: message }
  }
}
