'use server'

import { resolveBackendToken } from '@/lib/backend-token'
import { createLogger } from '@/lib/logger'
import type { AdvanceResult, AdvanceStation } from '@/lib/validators/production-advance'
import { ProductionAdvanceServiceError, advanceJobs } from '@/services/production-advance.service'

const log = createLogger('ProductionAdvanceActions')

export interface ActionResult<T = undefined> {
  ok: boolean
  error?: string
  data?: T
}

/**
 * Completes a station for one job or a whole selection.
 *
 * The station permission is checked by Tensor-Core against the token -
 * assembly:submit, finishing:submit, qc:submit, packaging:submit - so a role
 * that may finish but not QC can press the arrow on one tab and not the other.
 */
export async function advanceJobsAction(input: {
  brand: string
  station: AdvanceStation
  jobIds: string[]
}): Promise<ActionResult<AdvanceResult>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    return {
      ok: true,
      data: await advanceJobs({
        token,
        brand: input.brand,
        station: input.station,
        jobIds: input.jobIds,
      }),
    }
  } catch (err) {
    if (err instanceof ProductionAdvanceServiceError) return { ok: false, error: err.message }
    log.error({ err }, 'Unexpected advance error')
    return { ok: false, error: 'Something went wrong.' }
  }
}
