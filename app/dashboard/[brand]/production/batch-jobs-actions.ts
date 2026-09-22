'use server'

import { revalidatePath } from 'next/cache'

import { toBatchRecord } from '@/components/production/adapters'
import type { BatchRecord } from '@/components/production/types'
import { resolveBackendToken } from '@/lib/backend-token'
import {
  type Batch,
  type BatchDeleteResult,
  type BatchQueueOptions,
  type BatchQueueResult,
  type BatchRebuildResult,
  type BatchReprintResult,
  type BatchableJobs,
  type CompleteBatchJobsResult,
  BatchQueueInputSchema,
  BatchReprintInputSchema,
  CustomBatchInputSchema,
} from '@/lib/validators/batches'
import type { Machine } from '@/lib/validators/machines'
import {
  type FailJobResult,
  type ProductionJob,
  FailJobInputSchema,
} from '@/lib/validators/production'
import {
  BatchServiceError,
  completeBatchJobs,
  createCustomBatch,
  deleteBatch,
  getBatch,
  getBatchQueueOptions,
  listBatchableJobs,
  queueBatchToMachine,
  rebuildBatchModels,
  reprintBatchJobs,
} from '@/services/batches.service'
import { listMachines } from '@/services/machines.service'
import {
  failProductionJob as failProductionJobCall,
  listProductionJobsForBatch,
  ProductionServiceError,
  skipAssembly as skipAssemblyCall,
} from '@/services/production.service'

import type { ActionResult } from './actions'

// listBatchJobs backs the machine-assignment board's expandable Completed
// card: the jobs are fetched when a card is opened rather than loaded with
// every batch up front, so the board stays cheap when nothing is expanded.
export async function listBatchJobs(batchId: string): Promise<ActionResult<ProductionJob[]>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const jobs = await listProductionJobsForBatch(token, batchId)
    return { ok: true, data: jobs }
  } catch (err) {
    const message =
      err instanceof ProductionServiceError ? err.message : "Could not load the batch's jobs."
    return { ok: false, error: message }
  }
}

// getBatchDetail backs the queue board's batch detail sheet. It fetches the
// SINGLE-batch endpoint rather than reusing the board's own row: only that
// response carries the merged plate's bounding box (see BatchRecord's
// plateBbox* fields and toBatchRecord), which the plate preview needs to say
// how much of the bed the plate occupies. Machines come along for the header's
// assigned-machine name.
//
// Loaded on open, not with the board - a machine's Completed column alone can
// hold dozens of batches, and none of this is worth fetching until someone
// actually opens one.
export async function getBatchDetail(batchId: string): Promise<
  ActionResult<{
    batch: BatchRecord
    jobs: ProductionJob[]
    machines: Machine[]
  }>
> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const [batch, jobs, machines] = await Promise.all([
      getBatch(token, batchId),
      listProductionJobsForBatch(token, batchId),
      listMachines(token),
    ])
    return { ok: true, data: { batch: toBatchRecord(batch), jobs, machines } }
  } catch (err) {
    const message =
      err instanceof ProductionServiceError ? err.message : 'Could not load the batch.'
    return { ok: false, error: message }
  }
}

// markJobPrintDone is the board's "Done": the print came off the bed and needs
// no assembly, so assembly is marked not_required and the job drops straight
// into the Finishing tab. It is the same endpoint the Assembly tab's Skip uses
// - the decision is identical, only the surface differs.
export async function markJobPrintDone(
  brand: string,
  jobId: string,
): Promise<ActionResult<ProductionJob>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const job = await skipAssemblyCall(token, jobId)
    revalidatePath(`/dashboard/${brand}/production/machines`)
    revalidatePath(`/dashboard/${brand}/production/packaging`)
    revalidatePath(`/dashboard/${brand}/production/jobs/${jobId}`)
    return { ok: true, data: job }
  } catch (err) {
    const message = err instanceof ProductionServiceError ? err.message : 'Could not mark it done.'
    return { ok: false, error: message }
  }
}

/**
 * Which printers could run this bed, and what the others are missing.
 *
 * Read when the Queue dialog opens rather than with the page: a queue tab can
 * hold dozens of beds, and each row would otherwise carry thirteen printers'
 * worth of AMS state nobody has asked to see.
 */
export async function loadBatchQueueOptions(
  batchId: string,
): Promise<ActionResult<BatchQueueOptions>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const options = await getBatchQueueOptions(token, batchId)
    return { ok: true, data: options }
  } catch (err) {
    const message =
      err instanceof BatchServiceError
        ? err.message
        : 'Could not read which printers can take this batch.'
    return { ok: false, error: message }
  }
}

/**
 * Sends a bed to the printer somebody picked, locking a Draft on the way.
 *
 * The machine id is re-checked against the bed's colours by the backend. The
 * dropdown only offers eligible printers, but a server action's arguments are
 * client-controlled - the dialog is a convenience, not the rule.
 */
export async function queueBatchToMachineAction(
  brand: string,
  batchId: string,
  input: unknown,
): Promise<ActionResult<BatchQueueResult>> {
  const parsed = BatchQueueInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Pick a printer to send this batch to.',
    }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const result = await queueBatchToMachine(token, batchId, parsed.data)
    revalidatePath(`/dashboard/${brand}/production/machines`)
    revalidatePath(`/dashboard/${brand}/production/batches`)
    return { ok: true, data: result }
  } catch (err) {
    const message =
      err instanceof BatchServiceError ? err.message : 'Could not send this batch to that printer.'
    return { ok: false, error: message }
  }
}

/**
 * Deletes a bed, returning its jobs to the queue.
 *
 * Not a tidy-up of a row: the bed's plate is withdrawn from BambuBuddy, its
 * reserved filament is given back, and its jobs go to the pool to be re-planned.
 * The backend refuses a bed that is printing or has printed, and says which.
 */
/**
 * Every product waiting to go on a bed, for building one by hand.
 *
 * Read on demand rather than with the page: the pool changes as beds are
 * planned, and a list fetched when the Batches page loaded would offer products
 * another bed has since claimed.
 */
export async function loadBatchableJobs(): Promise<ActionResult<BatchableJobs>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const jobs = await listBatchableJobs(token)
    return { ok: true, data: jobs }
  } catch (err) {
    const message =
      err instanceof BatchServiceError ? err.message : 'Could not read the products waiting.'
    return { ok: false, error: message }
  }
}

/**
 * Builds a Draft bed from products somebody chose.
 *
 * The backend re-checks every one of them - eligibility, one colour, the unit
 * cap - because these ids are client-controlled and the list they came from may
 * have been on screen for minutes.
 */
export async function createCustomBatchAction(
  brand: string,
  input: unknown,
): Promise<ActionResult<Batch>> {
  const parsed = CustomBatchInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Choose at least one product for this bed.',
    }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const batch = await createCustomBatch(token, parsed.data)
    revalidatePath(`/dashboard/${brand}/production/batches`)
    revalidatePath(`/dashboard/${brand}/production/machines`)
    revalidatePath(`/dashboard/${brand}/production/jobs`)
    return { ok: true, data: batch }
  } catch (err) {
    const message = err instanceof BatchServiceError ? err.message : 'Could not create the batch.'
    return { ok: false, error: message }
  }
}

export async function deleteBatchAction(
  brand: string,
  batchId: string,
): Promise<ActionResult<BatchDeleteResult>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const result = await deleteBatch(token, batchId)
    revalidatePath(`/dashboard/${brand}/production/batches`)
    revalidatePath(`/dashboard/${brand}/production/machines`)
    revalidatePath(`/dashboard/${brand}/production/jobs`)
    return { ok: true, data: result }
  } catch (err) {
    const message = err instanceof BatchServiceError ? err.message : 'Could not delete this batch.'
    return { ok: false, error: message }
  }
}

/**
 * Checks every model on a bed against the order it was built from, and rebuilds
 * the ones that disagree.
 *
 * Only the mismatches are re-rendered, so the answer names which jobs were
 * wrong and why - "built as NAVYA & KRISHNA, ordered as APRAJITA & AJAY" - and
 * which were already correct. The bed's plate is rebuilt by the worker once the
 * last render lands, so this returns before the models have actually changed.
 */
export async function rebuildBatch(
  brand: string,
  batchId: string,
): Promise<ActionResult<BatchRebuildResult>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const result = await rebuildBatchModels(token, batchId)
    revalidatePath(`/dashboard/${brand}/production/batches/${batchId}`)
    revalidatePath(`/dashboard/${brand}/production/batches`)
    return { ok: true, data: result }
  } catch (err) {
    const message =
      err instanceof BatchServiceError ? err.message : "Could not check this batch's models."
    return { ok: false, error: message }
  }
}

/**
 * Reprints the chosen planks off a finished bed onto a new locked one.
 *
 * A selection, not the whole bed: three of four planks are usually fine, and
 * reprinting those is filament nobody needs. The chosen jobs are failed with the
 * given reason and their reprints land together on one new batch, ready to send.
 */
export async function reprintBatch(
  brand: string,
  batchId: string,
  input: unknown,
): Promise<ActionResult<BatchReprintResult>> {
  const parsed = BatchReprintInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Pick the planks to reprint and a reason.',
    }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const result = await reprintBatchJobs(token, batchId, parsed.data)
    revalidatePath(`/dashboard/${brand}/production/machines`)
    revalidatePath(`/dashboard/${brand}/production/batches`)
    revalidatePath(`/dashboard/${brand}/production/jobs`)
    return { ok: true, data: result }
  } catch (err) {
    const message =
      err instanceof BatchServiceError ? err.message : 'Could not reprint these planks.'
    return { ok: false, error: message }
  }
}

// reprintJob fails this job with a reason and returns the reprint the backend
// cloned at urgent priority. A reprint always carries why it happened - there
// is deliberately no no-fault reprint path.
export async function reprintJob(
  brand: string,
  jobId: string,
  input: unknown,
): Promise<ActionResult<FailJobResult>> {
  const parsed = FailJobInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Pick a reason for the reprint.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const result = await failProductionJobCall(token, jobId, parsed.data)
    revalidatePath(`/dashboard/${brand}/production/machines`)
    revalidatePath(`/dashboard/${brand}/production/jobs`)
    return { ok: true, data: result }
  } catch (err) {
    const message =
      err instanceof ProductionServiceError ? err.message : 'Could not queue the reprint.'
    return { ok: false, error: message }
  }
}

/**
 * Signs off the selected planks on a bed.
 *
 * A selection rather than a switch: a plate comes off the printer with three
 * good planks and one warped, and marking the whole bed Done would finish the
 * warped one as though it had passed. The bed itself only becomes Done when
 * nothing on it is outstanding - the backend decides that and reports how many
 * are left, so the dialog can say "3 marked done, 1 still to go" without asking
 * again.
 */
export async function completeBatchJobsAction(
  brand: string,
  batchId: string,
  jobIds: string[],
): Promise<ActionResult<CompleteBatchJobsResult>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const result = await completeBatchJobs(token, batchId, jobIds)
    revalidatePath(`/dashboard/${brand}/production/batches`)
    revalidatePath(`/dashboard/${brand}/production/batches/${batchId}`)
    revalidatePath(`/dashboard/${brand}/production/jobs`)
    return { ok: true, data: result }
  } catch (err) {
    const message =
      err instanceof BatchServiceError ? err.message : 'Could not mark those jobs done.'
    return { ok: false, error: message }
  }
}
