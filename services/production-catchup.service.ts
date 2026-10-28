import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type CatchUpPreview,
  CatchUpPreviewSchema,
  type CatchUpResult,
  CatchUpResultSchema,
} from '@/lib/validators/production-catchup'

const log = createLogger('ProductionCatchUpService')

const PREVIEW_TIMEOUT_MS = 20_000

/**
 * Generous, because this walks every job on the board one transaction at a
 * time. Fifteen hundred of them is not a quick request, and a timeout here
 * would report failure on a sweep that is still running - after which somebody
 * presses it again.
 */
const RUN_TIMEOUT_MS = 300_000

export class ProductionCatchUpServiceError extends Error {}

async function detailOf(response: Response): Promise<string | undefined> {
  return response
    .json()
    .then((body: { detail?: string }) => body.detail)
    .catch(() => undefined)
}

export async function previewCatchUp(token: string, brand: string): Promise<CatchUpPreview> {
  const path = `/brands/${encodeURIComponent(brand)}/production/catch-up`
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(PREVIEW_TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ path, err: error }, 'Tensor-Core is unreachable')
    throw new ProductionCatchUpServiceError('Tensor-Core is unreachable.')
  }
  if (!response.ok) {
    throw new ProductionCatchUpServiceError(
      (await detailOf(response)) ?? 'Could not read the station queues.',
    )
  }
  const parsed = CatchUpPreviewSchema.safeParse(await response.json())
  if (!parsed.success) {
    throw new ProductionCatchUpServiceError('Tensor-Core returned something unexpected.')
  }
  return parsed.data
}

/**
 * Runs the sweep.
 *
 * `confirm` is the count the preview reported, not a boolean. The backend
 * refuses if the queues have changed since - a sweep agreed for four jobs must
 * not quietly take six.
 */
export interface RunCatchUpOptions {
  token: string
  brand: string
  reason: string
  /** The count the preview reported. */
  confirm: number
}

export async function runCatchUp(options: RunCatchUpOptions): Promise<CatchUpResult> {
  const { token, brand, reason, confirm } = options
  const path = `/brands/${encodeURIComponent(brand)}/production/catch-up`
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason, confirm }),
      cache: 'no-store',
      signal: AbortSignal.timeout(RUN_TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ path, err: error }, 'Tensor-Core is unreachable')
    throw new ProductionCatchUpServiceError(
      'Tensor-Core did not answer in time. Some jobs may already have been marked — ' +
        'reload the board before trying again.',
    )
  }
  if (!response.ok) {
    throw new ProductionCatchUpServiceError(
      (await detailOf(response)) ?? 'The catch-up could not be run.',
    )
  }
  const parsed = CatchUpResultSchema.safeParse(await response.json())
  if (!parsed.success) {
    throw new ProductionCatchUpServiceError('Tensor-Core returned something unexpected.')
  }
  return parsed.data
}
