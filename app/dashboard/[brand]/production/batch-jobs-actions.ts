'use server'

import { revalidatePath } from 'next/cache'

import { toBatchRecord } from '@/components/production/adapters'
import type { BatchRecord } from '@/components/production/types'
import { resolveBackendToken } from '@/lib/backend-token'
import type { CompleteBatchJobsResult } from '@/lib/validators/batches'
import type { Machine } from '@/lib/validators/machines'
import {
  type FailJobResult,
  type ProductionJob,
  FailJobInputSchema,
} from '@/lib/validators/production'
import { BatchServiceError, completeBatchJobs, getBatch } from '@/services/batches.service'
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
