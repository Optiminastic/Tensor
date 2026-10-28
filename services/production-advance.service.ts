import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type AdvanceResult,
  AdvanceResultSchema,
  type AdvanceStation,
} from '@/lib/validators/production-advance'

const log = createLogger('ProductionAdvanceService')

/** Long enough for a tray of a few hundred, each its own transaction. */
const TIMEOUT_MS = 120_000

export class ProductionAdvanceServiceError extends Error {}

export interface AdvanceJobsOptions {
  token: string
  brand: string
  station: AdvanceStation
  jobIds: string[]
}

/**
 * Completes one station for one or many jobs.
 *
 * Records no checklist - that is what the station dialogs are for. The backend
 * marks the event so a job's history never implies an inspection nobody did.
 */
export async function advanceJobs(options: AdvanceJobsOptions): Promise<AdvanceResult> {
  const { token, brand, station, jobIds } = options
  const path = `/brands/${encodeURIComponent(brand)}/production/advance`

  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ station, job_ids: jobIds }),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ path, err: error }, 'Tensor-Core is unreachable')
    throw new ProductionAdvanceServiceError('Tensor-Core is unreachable, so nothing moved.')
  }
  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    throw new ProductionAdvanceServiceError(detail ?? 'Those jobs could not be moved on.')
  }
  const parsed = AdvanceResultSchema.safeParse(await response.json())
  if (!parsed.success) {
    throw new ProductionAdvanceServiceError('Tensor-Core returned something unexpected.')
  }
  return parsed.data
}
