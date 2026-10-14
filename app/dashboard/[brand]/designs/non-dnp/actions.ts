'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import { DesignJobsServiceError, supplyDesignJobModel } from '@/services/design-jobs.service'

/**
 * Supplies the 3MF for a production job Tensor cannot build itself.
 *
 * The designer's equivalent of job-model-actions.ts, pointed at /design-jobs
 * so it carries design:job_supply rather than production:update - a DESIGNER
 * holds neither production permission, and granting one to reach an upload
 * would also grant patching and failing any job.
 *
 * FormData rather than typed arguments because a File cannot cross the server
 * action boundary any other way.
 */
export async function supplyDesignJobModelAction(
  jobId: string,
  form: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Choose a model file to upload.' }
  }

  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }

  try {
    await supplyDesignJobModel(token, jobId, file)
    // The row leaves the queue the moment it has a file, so the list is what
    // has to be refetched.
    revalidatePath('/dashboard/[brand]/designs/non-dnp', 'page')
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof DesignJobsServiceError ? err.message : 'Could not upload the design file.',
    }
  }
}
