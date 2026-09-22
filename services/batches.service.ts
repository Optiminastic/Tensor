// Server-only by placement (called from server actions, server components, and
// the /api/batches/[id]/preview proxy route).
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type AddJobsToBatchInput,
  type AutoCreateBatchesResult,
  type Batch,
  type BatchApproveInput,
  type BatchPatchInput,
  type BatchDeleteResult,
  type BatchQueueInput,
  type BatchQueueOptions,
  type BatchQueueResult,
  type BatchRebuildResult,
  type BatchReprintInput,
  type BatchReprintResult,
  type BatchableJobs,
  type CompleteBatchJobsResult,
  type CustomBatchInput,
  type PrintBatchResult,
  AutoCreateBatchesResultSchema,
  BatchDeleteResultSchema,
  BatchQueueOptionsSchema,
  BatchQueueResultSchema,
  BatchRebuildResultSchema,
  BatchReprintResultSchema,
  BatchSchema,
  BatchableJobsSchema,
  CompleteBatchJobsResultSchema,
  PrintBatchResultSchema,
} from '@/lib/validators/batches'
import { type ProductionJob, ProductionJobSchema } from '@/lib/validators/production'

const log = createLogger('BatchService')
const TIMEOUT_MS = 15_000
const FILE_TIMEOUT_MS = 30_000
// Calls that Tensor-Core serves by talking to BambuBuddy wait longer than
// Tensor-Core itself does (its BambuBuddy client gives up at 30s). Below that,
// the browser always aborts first and reports the wrong service as broken -
// the backend never gets to say "could not reach BambuBuddy".
const BAMBUBUDDY_TIMEOUT_MS = 35_000

/**
 * Typed client for Tensor-Core's /batches and /machine-fleet/:id/queue
 * endpoints. Server-only; every call carries the caller's bearer token and the
 * backend enforces batch/machine permissions against it.
 */
export class BatchServiceError extends Error {}

async function call<T>(path: string, init: RequestInit, parse: (data: unknown) => T): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      ...init,
      cache: 'no-store',
      // The caller's own signal wins, so a BambuBuddy-backed call can outwait
      // the backend rather than being cut off at the default.
      signal: init.signal ?? AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    // A timeout and a refused connection are different faults with different
    // fixes, and calling both "unreachable" sent somebody looking for a
    // stopped backend when Tensor-Core was up and waiting on BambuBuddy.
    const timedOut = error instanceof Error && error.name === 'TimeoutError'
    log.error({ path, err: error, timedOut }, 'Tensor-Core call failed')
    throw new BatchServiceError(
      timedOut
        ? 'Tensor-Core did not answer in time. It may be waiting on BambuBuddy.'
        : 'Tensor-Core is unreachable. Is the backend running?',
    )
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ path, status: response.status, detail }, 'Tensor-Core rejected the request')
    throw new BatchServiceError(detail ?? `Request failed (${response.status})`)
  }

  return parse(await response.json())
}

function jsonHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
}

export async function listBatches(token: string): Promise<Batch[]> {
  return call('/batches', { headers: jsonHeaders(token) }, data => BatchSchema.array().parse(data))
}

export async function getBatch(token: string, id: string): Promise<Batch> {
  return call(`/batches/${encodeURIComponent(id)}`, { headers: jsonHeaders(token) }, data =>
    BatchSchema.parse(data),
  )
}

export async function patchBatch(
  token: string,
  id: string,
  input: BatchPatchInput,
): Promise<Batch> {
  return call(
    `/batches/${encodeURIComponent(id)}`,
    { method: 'PATCH', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => BatchSchema.parse(data),
  )
}

export async function approveBatch(
  token: string,
  id: string,
  input: BatchApproveInput,
): Promise<Batch> {
  return call(
    `/batches/${encodeURIComponent(id)}/approve`,
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => BatchSchema.parse(data),
  )
}

/**
 * Sends a locked batch's sliced plate to BambuBuddy and queues it for printing.
 *
 * Queues rather than prints: BambuBuddy's own dispatcher decides when the bed
 * actually starts, so this returns as soon as the plate is on its queue.
 */
export async function printBatch(token: string, id: string): Promise<PrintBatchResult> {
  return call(
    `/batches/${encodeURIComponent(id)}/print`,
    {
      method: 'POST',
      headers: jsonHeaders(token),
      signal: AbortSignal.timeout(BAMBUBUDDY_TIMEOUT_MS),
    },
    data => PrintBatchResultSchema.parse(data),
  )
}

export async function autoCreateBatches(token: string): Promise<AutoCreateBatchesResult> {
  return call('/batches/auto-create', { method: 'POST', headers: jsonHeaders(token) }, data =>
    AutoCreateBatchesResultSchema.parse(data),
  )
}

// listCompatibleJobsForBatch offers only unassigned jobs sharing the batch's
// material/nozzle/machine-family - the picker for addJobsToBatch below.
export async function listCompatibleJobsForBatch(
  token: string,
  batchId: string,
): Promise<ProductionJob[]> {
  return call(
    `/batches/${encodeURIComponent(batchId)}/compatible-jobs`,
    { headers: jsonHeaders(token) },
    data => ProductionJobSchema.array().parse(data),
  )
}

// addJobsToBatch assigns compatible, currently-unassigned jobs onto a Draft
// batch and re-merges its plate preview. Only pending_approval batches accept
// this (409 otherwise); rejected (422) if the batch is already at/over the
// full threshold or a job doesn't match its configuration.
export async function addJobsToBatch(
  token: string,
  batchId: string,
  input: AddJobsToBatchInput,
): Promise<Batch> {
  return call(
    `/batches/${encodeURIComponent(batchId)}/jobs`,
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => BatchSchema.parse(data),
  )
}

// removeJobFromBatch detaches one job from a Draft batch and re-merges its
// plate preview - the counterpart that frees up room for addJobsToBatch.
export async function removeJobFromBatch(
  token: string,
  batchId: string,
  jobId: string,
): Promise<Batch> {
  return call(
    `/batches/${encodeURIComponent(batchId)}/jobs/${encodeURIComponent(jobId)}`,
    { method: 'DELETE', headers: jsonHeaders(token) },
    data => BatchSchema.parse(data),
  )
}

/**
 * Marks the named planks on a bed done.
 *
 * A selection, not a switch: a plate comes off the printer with three good
 * planks and one warped, and the bed only becomes Done once nothing on it is
 * outstanding.
 */
export async function completeBatchJobs(
  token: string,
  batchId: string,
  jobIds: string[],
): Promise<CompleteBatchJobsResult> {
  return call(
    `/batches/${encodeURIComponent(batchId)}/jobs/complete`,
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify({ job_ids: jobIds }) },
    data => CompleteBatchJobsResultSchema.parse(data),
  )
}

/**
 * Deletes a bed and returns its jobs to the pool.
 *
 * The jobs are not deleted with it - they go back to be re-planned - which is
 * why the result reports how many were released. Refused on a bed that is
 * printing (a machine is working on it) or has printed (that bed is the record
 * of what was made).
 */
export async function deleteBatch(token: string, batchId: string): Promise<BatchDeleteResult> {
  return call(
    `/batches/${encodeURIComponent(batchId)}`,
    { method: 'DELETE', headers: jsonHeaders(token) },
    data => BatchDeleteResultSchema.parse(data),
  )
}

/**
 * Checks a bed's models against the orders they were built from, and rebuilds
 * the ones that disagree.
 *
 * Only the mismatches are re-rendered - a bed of four where one is wrong costs
 * one render, not four - and the result names which were rebuilt, which were
 * already correct, and which could not be checked. The bed's plate is rebuilt
 * by the worker once the last render lands, so this answers before the models
 * have changed.
 */
export async function rebuildBatchModels(
  token: string,
  batchId: string,
): Promise<BatchRebuildResult> {
  return call(
    `/batches/${encodeURIComponent(batchId)}/rebuild`,
    { method: 'POST', headers: jsonHeaders(token) },
    data => BatchRebuildResultSchema.parse(data),
  )
}

/**
 * Reprints chosen planks from a finished bed onto a new locked one.
 *
 * A selection rather than the whole bed, because a bed is rarely wholly wrong -
 * reprinting the planks that were fine is filament nobody needs. The reprints
 * land on one new batch, locked and ready to send.
 */
export async function reprintBatchJobs(
  token: string,
  batchId: string,
  input: BatchReprintInput,
): Promise<BatchReprintResult> {
  return call(
    `/batches/${encodeURIComponent(batchId)}/reprint`,
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => BatchReprintResultSchema.parse(data),
  )
}

/**
 * Which printers could run this bed, and what the others are missing.
 *
 * Read from Tensor's mirror of the fleet rather than from BambuBuddy directly,
 * so opening the dialog costs one query instead of thirteen calls over the
 * tunnel.
 */
export async function getBatchQueueOptions(
  token: string,
  batchId: string,
): Promise<BatchQueueOptions> {
  return call(
    `/batches/${encodeURIComponent(batchId)}/queue-options`,
    { headers: jsonHeaders(token) },
    data => BatchQueueOptionsSchema.parse(data),
  )
}

/**
 * Sends a bed to one chosen printer, locking it first if it is still a Draft.
 *
 * Slower than the other calls because Tensor uploads the plate and waits for
 * BambuBuddy to accept it, so it gets the BambuBuddy timeout.
 */
export async function queueBatchToMachine(
  token: string,
  batchId: string,
  input: BatchQueueInput,
): Promise<BatchQueueResult> {
  return call(
    `/batches/${encodeURIComponent(batchId)}/queue`,
    {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(BAMBUBUDDY_TIMEOUT_MS),
    },
    data => BatchQueueResultSchema.parse(data),
  )
}

export async function getFleetMachineQueue(
  token: string,
  fleetMachineId: string,
): Promise<Batch[]> {
  return call(
    `/machine-fleet/${encodeURIComponent(fleetMachineId)}/queue`,
    { headers: jsonHeaders(token) },
    data => BatchSchema.array().parse(data),
  )
}

// fetchBatchPreview streams the batch's merged-plate STL. Returns the raw
// Response so the /api/batches/[id]/preview route can pipe the body straight
// through without buffering, same pattern as designs.service.ts#fetchDesignFile.
export async function fetchBatchPreview(token: string, id: string): Promise<Response> {
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}/batches/${encodeURIComponent(id)}/preview`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(FILE_TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ id, err: error }, 'Tensor-Core is unreachable')
    throw new BatchServiceError('Tensor-Core is unreachable. Is the backend running?')
  }
  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    throw new BatchServiceError(detail ?? `Request failed (${response.status})`)
  }
  return response
}

/**
 * Every product eligible to be put on a bed by hand.
 *
 * The same pool the planner draws from, so a job it would refuse — held,
 * flagged, personalisation unresolved — is not offered here either.
 */
export async function listBatchableJobs(token: string): Promise<BatchableJobs> {
  return call('/batches/batchable-jobs', { headers: jsonHeaders(token) }, data =>
    BatchableJobsSchema.parse(data),
  )
}

/** Builds a Draft bed from products somebody chose. */
export async function createCustomBatch(token: string, input: CustomBatchInput): Promise<Batch> {
  return call(
    '/batches/custom',
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => BatchSchema.parse(data),
  )
}
