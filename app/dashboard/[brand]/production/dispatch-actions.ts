'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import { type DispatchOrder, DispatchCreateInputSchema } from '@/lib/validators/dispatch'
import {
  createDispatchOrder as createDispatchOrderCall,
  DispatchServiceError,
  markDispatched as markDispatchedCall,
} from '@/services/dispatch.service'

import type { ActionResult } from './actions'

// createDispatch books the shipment for an order whose jobs are all packaged -
// the Dispatch tab's first step. The record starts 'pending'; the courier
// handover is a second action (markOrderDispatched). The backend enforces
// dispatch:manage and that the order exists.
export async function createDispatch(
  brand: string,
  input: unknown,
): Promise<ActionResult<DispatchOrder>> {
  const parsed = DispatchCreateInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the dispatch details.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const dispatch = await createDispatchOrderCall(token, parsed.data)
    revalidatePath(`/dashboard/${brand}/production/packaging`)
    revalidatePath(`/dashboard/${brand}/production/orders/${parsed.data.order_id}`)
    return { ok: true, data: dispatch }
  } catch (err) {
    const message =
      err instanceof DispatchServiceError ? err.message : 'Could not create the dispatch order.'
    return { ok: false, error: message }
  }
}

// markOrderDispatched is the handover itself: status -> dispatched, stamped
// with dispatched_at by the backend. It also flips the job's derived pipeline
// stage to DISPATCHED (production/lifecycle.go#PipelineStage), so the job
// queue is revalidated too.
export async function markOrderDispatched(
  brand: string,
  dispatchId: string,
): Promise<ActionResult<DispatchOrder>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const dispatch = await markDispatchedCall(token, dispatchId)
    revalidatePath(`/dashboard/${brand}/production/packaging`)
    revalidatePath(`/dashboard/${brand}/production/jobs`)
    return { ok: true, data: dispatch }
  } catch (err) {
    const message =
      err instanceof DispatchServiceError ? err.message : 'Could not mark the order as dispatched.'
    return { ok: false, error: message }
  }
}
