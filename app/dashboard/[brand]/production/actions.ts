'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import {
  type AutoCreateBatchesResult,
  type Batch,
  BatchApproveInputSchema,
  BatchPatchInputSchema,
} from '@/lib/validators/batches'
import { type Machine, MachineStatusSchema } from '@/lib/validators/machines'
import {
  type Filament,
  type ProductionJob,
  FilamentInputSchema,
  JobPatchInputSchema,
  PersonalisationValidateInputSchema,
} from '@/lib/validators/production'
import {
  approveBatch as approveBatchCall,
  autoCreateBatches as autoCreateBatchesCall,
  BatchServiceError,
  patchBatch as patchBatchCall,
} from '@/services/batches.service'
import { MachineServiceError, updateMachine } from '@/services/machines.service'
import {
  createJobsFromOrder as createJobsFromOrderCall,
  patchProductionJob,
  ProductionServiceError,
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
