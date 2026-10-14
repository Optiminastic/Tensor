import 'server-only'

import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import { ProductionJobSchema, type ProductionJob } from '@/lib/validators/production'

const log = createLogger('DesignJobsService')
const TIMEOUT_MS = 15_000
// A design file is tens of megabytes and crosses the wire twice.
const UPLOAD_TIMEOUT_MS = 120_000

/**
 * The designer's half of the production queue: the jobs waiting for a 3MF
 * somebody has to draw.
 *
 * Its own endpoints rather than the production ones, because a DESIGNER does
 * not hold production:read and should not - see design:job_read in
 * Tensor-Core's auth catalog. The rows are ordinary production jobs, so the
 * existing ProductionJobSchema validates them unchanged.
 */
export class DesignJobsServiceError extends Error {}

export async function listDesignJobs(token: string): Promise<ProductionJob[]> {
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}/design-jobs`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ err: error }, 'Tensor-Core is unreachable')
    throw new DesignJobsServiceError('Tensor-Core is unreachable. Is the backend running?')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ status: response.status, detail }, 'Tensor-Core rejected the design queue request')
    throw new DesignJobsServiceError(detail ?? `Request failed (${response.status})`)
  }

  return ProductionJobSchema.array().parse(await response.json())
}

/**
 * Attaches a designer's files to a job, and returns every job they produced.
 *
 * The FormData is passed through rather than built here, because the caller is
 * a server action holding files that cannot cross that boundary any other way.
 *
 * The backend reads each file's own colours and refuses a product it renders
 * itself, so a 422 here is a real answer rather than a failure to report: it
 * means the job belongs to the render path, not to a designer.
 */
export async function supplyDesignJobModel(
  token: string,
  jobId: string,
  body: FormData,
): Promise<ProductionJob[]> {
  let response: Response
  try {
    response = await fetch(
      `${env.TENSOR_CORE_URL}/design-jobs/${encodeURIComponent(jobId)}/model`,
      {
        method: 'POST',
        // No Content-Type: fetch sets the multipart boundary itself, and naming
        // it by hand produces a body the server cannot parse.
        headers: { Authorization: `Bearer ${token}` },
        body,
        cache: 'no-store',
        signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
      },
    )
  } catch (error) {
    log.error({ err: error, jobId }, 'Tensor-Core is unreachable')
    throw new DesignJobsServiceError('Tensor-Core is unreachable. Is the backend running?')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ jobId, status: response.status, detail }, 'Tensor-Core rejected the design file')
    throw new DesignJobsServiceError(detail ?? `Upload failed (${response.status})`)
  }

  // An array: one job per file. A product that takes a body and a clip comes
  // back as two, the second created by this upload.
  return ProductionJobSchema.array().parse(await response.json())
}
