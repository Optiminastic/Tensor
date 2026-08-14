'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import { type ProductionJob, FinishingInputSchema } from '@/lib/validators/production'
import {
  ProductionServiceError,
  skipFinishing as skipFinishingCall,
  submitFinishing as submitFinishingCall,
} from '@/services/production.service'

import type { ActionResult } from './actions'

// submitJobFinishing records the finishing pass (supports removed, sanded,
// seams cleaned). The backend rejects it until assembly is completed or
// skipped, and refuses QC until this is resolved - both enforced there, not
// re-checked here.
export async function submitJobFinishing(
  brand: string,
  jobId: string,
  input: unknown,
): Promise<ActionResult<ProductionJob>> {
  const parsed = FinishingInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the finishing check.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const job = await submitFinishingCall(token, jobId, parsed.data)
    revalidatePath(`/dashboard/${brand}/production/packaging`)
    revalidatePath(`/dashboard/${brand}/production/jobs/${jobId}`)
    return { ok: true, data: job }
  } catch (err) {
    const message =
      err instanceof ProductionServiceError ? err.message : 'Could not record finishing.'
    return { ok: false, error: message }
  }
}

// skipJobFinishing marks finishing as not required for a part that needs no
// finishing - no form, just the decision, mirroring skipJobAssembly.
export async function skipJobFinishing(
  brand: string,
  jobId: string,
): Promise<ActionResult<ProductionJob>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const job = await skipFinishingCall(token, jobId)
    revalidatePath(`/dashboard/${brand}/production/packaging`)
    revalidatePath(`/dashboard/${brand}/production/jobs/${jobId}`)
    return { ok: true, data: job }
  } catch (err) {
    const message =
      err instanceof ProductionServiceError ? err.message : 'Could not skip finishing.'
    return { ok: false, error: message }
  }
}
