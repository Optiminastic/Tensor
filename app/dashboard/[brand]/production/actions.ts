'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import {
  type AutoCreateBatchesResult,
  type Batch,
  AddJobsToBatchInputSchema,
  BatchApproveInputSchema,
  BatchPatchInputSchema,
} from '@/lib/validators/batches'
import { type Machine, MachineStatusSchema } from '@/lib/validators/machines'
import {
  type Filament,
  type ProductionJob,
  type QcSubmitResult,
  AssemblyInputSchema,
  FilamentInputSchema,
  JobPatchInputSchema,
  PackagingInputSchema,
  PersonalisationValidateInputSchema,
  QcInputSchema,
} from '@/lib/validators/production'
import {
  addJobsToBatch as addJobsToBatchCall,
  approveBatch as approveBatchCall,
  autoCreateBatches as autoCreateBatchesCall,
  BatchServiceError,
  listCompatibleJobsForBatch as listCompatibleJobsForBatchCall,
  patchBatch as patchBatchCall,
  removeJobFromBatch as removeJobFromBatchCall,
} from '@/services/batches.service'
import { MachineServiceError, updateMachine } from '@/services/machines.service'
import {
  createJobsFromOrder as createJobsFromOrderCall,
  patchProductionJob,
  ProductionServiceError,
  skipAssembly as skipAssemblyCall,
  submitAssembly as submitAssemblyCall,
  submitPackaging as submitPackagingCall,
  submitQc as submitQcCall,
  upsertFilament,
  validateJobPersonalisation as validateJobPersonalisationCall,
} from '@/services/production.service'

export interface ActionResult<T = undefined> {
  ok: boolean
  error?: string
  data?: T
}

// addFilament upserts a filament stock line (material + colour, grams available and
// reorder threshold). The backend enforces filament:manage; a duplicate (material,
// colour) updates the existing line rather than creating a second.
export async function addFilament(brand: string, input: unknown): Promise<ActionResult<Filament>> {
  const parsed = FilamentInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the filament details.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const filament = await upsertFilament(token, parsed.data)
    revalidatePath(`/dashboard/${brand}/production/inventory`)
    return { ok: true, data: filament }
  } catch (err) {
    const message =
      err instanceof ProductionServiceError ? err.message : 'Could not save the filament.'
    return { ok: false, error: message }
  }
}

// validateJobPersonalisation records the manual check (which fields the operator
// confirmed, customer approval, notes) on one production job. The backend
// overwrites all six confirm flags wholesale and derives the job's
// personalisation_status from them - never PATCH-able generically, only through
// this dedicated endpoint (see production_jobs.go#validatePersonalisation).
export async function validateJobPersonalisation(
  brand: string,
  jobId: string,
  input: unknown,
): Promise<ActionResult<ProductionJob>> {
  const parsed = PersonalisationValidateInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Check the personalisation details.',
    }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const job = await validateJobPersonalisationCall(token, jobId, parsed.data)
    revalidatePath(`/dashboard/${brand}/production/jobs`)
    revalidatePath(`/dashboard/${brand}/production/jobs/${jobId}`)
    return { ok: true, data: job }
  } catch (err) {
    const message =
      err instanceof ProductionServiceError
        ? err.message
        : 'Could not save the personalisation check.'
    return { ok: false, error: message }
  }
}

// createJobsFromOrder is the order list/detail's "Create Job" action - the
// manual backfill path for an order that hasn't gone through automatic Stage 2
// job creation yet. Idempotent on the backend (a second call for an order that
// already has jobs is surfaced as an error here, not silently duplicated).
export async function createJobsFromOrder(
  brand: string,
  orderId: string,
): Promise<ActionResult<ProductionJob[]>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const jobs = await createJobsFromOrderCall(token, orderId)
    revalidatePath(`/dashboard/${brand}/production/orders`)
    revalidatePath(`/dashboard/${brand}/production/orders/${orderId}`)
    revalidatePath(`/dashboard/${brand}/production/jobs`)
    return { ok: true, data: jobs }
  } catch (err) {
    const message =
      err instanceof ProductionServiceError ? err.message : 'Could not create production jobs.'
    return { ok: false, error: message }
  }
}

// updateProductionJob is the job queue's Hold/Resume and Start Production
// action - a partial PATCH (held and/or status). The backend role-gates every
// PATCHable field independently, so a rejected field surfaces as this action's
// error rather than a generic failure.
export async function updateProductionJob(
  brand: string,
  jobId: string,
  input: unknown,
): Promise<ActionResult<ProductionJob>> {
  const parsed = JobPatchInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the job update.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const job = await patchProductionJob(token, jobId, parsed.data)
    revalidatePath(`/dashboard/${brand}/production/jobs`)
    revalidatePath(`/dashboard/${brand}/production/jobs/${jobId}`)
    return { ok: true, data: job }
  } catch (err) {
    const message =
      err instanceof ProductionServiceError ? err.message : 'Could not update the job.'
    return { ok: false, error: message }
  }
}

// autoCreateBatches runs the Batch Optimizer on demand (the background worker
// already does this on a debounced trigger - this is for an operator who wants
// it now, e.g. right after manually creating jobs).
export async function autoCreateBatches(
  brand: string,
): Promise<ActionResult<AutoCreateBatchesResult>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const result = await autoCreateBatchesCall(token)
    revalidatePath(`/dashboard/${brand}/production/batches`)
    return { ok: true, data: result }
  } catch (err) {
    const message = err instanceof BatchServiceError ? err.message : 'Could not create batches.'
    return { ok: false, error: message }
  }
}

// approveBatchAction locks a Draft batch (pending_approval -> open): reserves
// filament, promotes the cached preview to the merged plate, and assigns the
// machine (defaulting to whatever the scheduler already picked at Draft
// creation - see machine_scheduler.go). Rejected (409, surfaced as an error
// here) if the batch was already approved.
export async function approveBatchAction(
  brand: string,
  batchId: string,
  input: unknown,
): Promise<ActionResult<Batch>> {
  const parsed = BatchApproveInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the machine selection.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const batch = await approveBatchCall(token, batchId, parsed.data)
    revalidatePath(`/dashboard/${brand}/production/batches`)
    revalidatePath(`/dashboard/${brand}/production/batches/${batchId}`)
    return { ok: true, data: batch }
  } catch (err) {
    const message = err instanceof BatchServiceError ? err.message : 'Could not approve the batch.'
    return { ok: false, error: message }
  }
}

// patchBatchAction is the manual-override affordance: move a batch's status
// forward (open -> in_progress -> completed) or reassign its machine.
export async function patchBatchAction(
  brand: string,
  batchId: string,
  input: unknown,
): Promise<ActionResult<Batch>> {
  const parsed = BatchPatchInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the batch update.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const batch = await patchBatchCall(token, batchId, parsed.data)
    revalidatePath(`/dashboard/${brand}/production/batches`)
    revalidatePath(`/dashboard/${brand}/production/batches/${batchId}`)
    return { ok: true, data: batch }
  } catch (err) {
    const message = err instanceof BatchServiceError ? err.message : 'Could not update the batch.'
    return { ok: false, error: message }
  }
}

// listCompatibleJobsForBatchAction feeds AddJobsToBatchDialog's picker - a
// read-only lookup, so it revalidates nothing.
export async function listCompatibleJobsForBatchAction(
  batchId: string,
): Promise<ActionResult<ProductionJob[]>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const jobs = await listCompatibleJobsForBatchCall(token, batchId)
    return { ok: true, data: jobs }
  } catch (err) {
    const message =
      err instanceof BatchServiceError ? err.message : 'Could not load compatible jobs.'
    return { ok: false, error: message }
  }
}

// addJobsToBatchAction assigns compatible jobs onto a Draft batch and
// re-merges its plate preview.
export async function addJobsToBatchAction(
  brand: string,
  batchId: string,
  input: unknown,
): Promise<ActionResult<Batch>> {
  const parsed = AddJobsToBatchInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Select at least one job.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const batch = await addJobsToBatchCall(token, batchId, parsed.data)
    revalidatePath(`/dashboard/${brand}/production/batches`)
    revalidatePath(`/dashboard/${brand}/production/batches/${batchId}`)
    return { ok: true, data: batch }
  } catch (err) {
    const message = err instanceof BatchServiceError ? err.message : 'Could not add the jobs.'
    return { ok: false, error: message }
  }
}

// removeJobFromBatchAction detaches one job from a Draft batch and re-merges
// its plate preview, freeing up room for a different job.
export async function removeJobFromBatchAction(
  brand: string,
  batchId: string,
  jobId: string,
): Promise<ActionResult<Batch>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const batch = await removeJobFromBatchCall(token, batchId, jobId)
    revalidatePath(`/dashboard/${brand}/production/batches`)
    revalidatePath(`/dashboard/${brand}/production/batches/${batchId}`)
    return { ok: true, data: batch }
  } catch (err) {
    const message = err instanceof BatchServiceError ? err.message : 'Could not remove the job.'
    return { ok: false, error: message }
  }
}

// The three post-print station actions - each revalidates the job's queue
// page, its own list page, and its detail page, mirroring the other job
// actions above.

export async function submitJobAssembly(
  brand: string,
  jobId: string,
  input: unknown,
): Promise<ActionResult<ProductionJob>> {
  const parsed = AssemblyInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the assembly check.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const job = await submitAssemblyCall(token, jobId, parsed.data)
    revalidatePath(`/dashboard/${brand}/production/packaging`)
    revalidatePath(`/dashboard/${brand}/production/jobs/${jobId}`)
    return { ok: true, data: job }
  } catch (err) {
    const message =
      err instanceof ProductionServiceError ? err.message : 'Could not record assembly.'
    return { ok: false, error: message }
  }
}

// skipJobAssembly marks assembly as not required for a job with no assembly
// step (e.g. a single-part print) - it needs no form, just confirmation.
export async function skipJobAssembly(
  brand: string,
  jobId: string,
): Promise<ActionResult<ProductionJob>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const job = await skipAssemblyCall(token, jobId)
    revalidatePath(`/dashboard/${brand}/production/packaging`)
    revalidatePath(`/dashboard/${brand}/production/jobs/${jobId}`)
    return { ok: true, data: job }
  } catch (err) {
    const message = err instanceof ProductionServiceError ? err.message : 'Could not skip assembly.'
    return { ok: false, error: message }
  }
}

// submitJobQc records a QC decision (pass/fail). A fail clones a reprint job
// at urgent priority on the backend, returned as reprint_job.
export async function submitJobQc(
  brand: string,
  jobId: string,
  input: unknown,
): Promise<ActionResult<QcSubmitResult>> {
  const parsed = QcInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the QC checklist.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const result = await submitQcCall(token, jobId, parsed.data)
    revalidatePath(`/dashboard/${brand}/production/packaging`)
    revalidatePath(`/dashboard/${brand}/production/jobs/${jobId}`)
    revalidatePath(`/dashboard/${brand}/production/jobs`)
    return { ok: true, data: result }
  } catch (err) {
    const message =
      err instanceof ProductionServiceError ? err.message : 'Could not record the QC check.'
    return { ok: false, error: message }
  }
}

// submitJobPackaging is the last station - requires qc_status = 'passed' on
// the backend, enforced there, not re-checked here.
export async function submitJobPackaging(
  brand: string,
  jobId: string,
  input: unknown,
): Promise<ActionResult<ProductionJob>> {
  const parsed = PackagingInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the packaging details.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const job = await submitPackagingCall(token, jobId, parsed.data)
    revalidatePath(`/dashboard/${brand}/production/packaging`)
    revalidatePath(`/dashboard/${brand}/production/jobs/${jobId}`)
    return { ok: true, data: job }
  } catch (err) {
    const message =
      err instanceof ProductionServiceError ? err.message : 'Could not record packaging.'
    return { ok: false, error: message }
  }
}

// setMachineStatus changes a machine's live status from the production surface. It
// is a partial PATCH (status only); the backend enforces machine:manage. Both the
// list row and the detail panel call it and revalidate so the badge tracks the
// persisted value.
export async function setMachineStatus(
  brand: string,
  machineId: string,
  status: unknown,
): Promise<ActionResult<Machine>> {
  const parsed = MachineStatusSchema.safeParse(status)
  if (!parsed.success) return { ok: false, error: 'Unknown machine status.' }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const machine = await updateMachine(token, machineId, { status: parsed.data })
    revalidatePath(`/dashboard/${brand}/production/machines`)
    revalidatePath(`/dashboard/${brand}/production/machines/${machineId}`)
    return { ok: true, data: machine }
  } catch (err) {
    const message =
      err instanceof MachineServiceError ? err.message : 'Could not update the machine status.'
    return { ok: false, error: message }
  }
}
