'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import { type StationIssueResult, StationIssueInputSchema } from '@/lib/validators/production'
import { ProductionServiceError, reportStationIssue } from '@/services/production.service'

import type { ActionResult } from './actions'

// reportJobIssue flags a defect found at assembly, finishing or QC. It records
// the reason, comment, who and when on the job's history and deliberately does
// NOT change the job's sub-status: the row stays in its station queue, visible,
// and can still be completed afterwards. At QC it can also queue a reprint of a
// partial quantity in the same transaction.
export async function reportJobIssue(
  brand: string,
  jobId: string,
  input: unknown,
): Promise<ActionResult<StationIssueResult>> {
  const parsed = StationIssueInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the issue details.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const result = await reportStationIssue(token, jobId, parsed.data)
    revalidatePath(`/dashboard/${brand}/production/packaging`)
    revalidatePath(`/dashboard/${brand}/production/jobs/${jobId}`)
    if (result.reprint_job) {
      revalidatePath(`/dashboard/${brand}/production/jobs`)
    }
    return { ok: true, data: result }
  } catch (err) {
    const message =
      err instanceof ProductionServiceError ? err.message : 'Could not record the issue.'
    return { ok: false, error: message }
  }
}
