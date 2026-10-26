'use server'

import { resolveBackendToken } from '@/lib/backend-token'
import { createLogger } from '@/lib/logger'
import type {
  DamagePaymentResult,
  DamagePickupResult,
  DamageReport,
  DamageReportDetail,
  DamageReports,
  DamageResolutionKind,
  DamageResolutionResult,
  DamageStatus,
} from '@/lib/validators/whatsapp-damage'
import {
  DamageServiceError,
  bookDamagePickup,
  confirmDamagePayment,
  getDamageReport,
  listDamageReports,
  resolveDamageReport,
  updateDamageReport,
} from '@/services/whatsapp-damage.service'

const log = createLogger('DamageReportActions')

export interface ActionResult<T = undefined> {
  ok: boolean
  error?: string
  data?: T
}

function failure<T>(error: unknown): ActionResult<T> {
  if (error instanceof DamageServiceError) return { ok: false, error: error.message }
  log.error({ err: error }, 'Unexpected damage-report error')
  return { ok: false, error: 'Something went wrong. Please try again.' }
}

/*
 * Every action re-resolves the token from the session. The brand and report id
 * are client-controlled; Tensor-Core checks whatsapp:read and whatsapp:reply
 * against the token, and that is the only check that counts.
 */

export async function listDamageReportsAction(brand: string): Promise<ActionResult<DamageReports>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    return { ok: true, data: await listDamageReports(token, brand) }
  } catch (err) {
    return failure(err)
  }
}

export async function loadDamageReportAction(input: {
  brand: string
  id: string
}): Promise<ActionResult<DamageReportDetail>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    return { ok: true, data: await getDamageReport(token, input.brand, input.id) }
  } catch (err) {
    return failure(err)
  }
}

export async function updateDamageReportAction(input: {
  brand: string
  id: string
  status?: DamageStatus
  resolutionNote?: string
}): Promise<ActionResult<DamageReport>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const data = await updateDamageReport({
      token,
      brand: input.brand,
      id: input.id,
      status: input.status,
      resolution_note: input.resolutionNote,
    })
    return { ok: true, data }
  } catch (err) {
    return failure(err)
  }
}

/**
 * Decides a damaged parcel's outcome: reprint at our cost, ask for the ₹100
 * reverse pickup, or close it because support already sorted it.
 *
 * NOT RETRYABLE. The backend records the decision once and refuses a second,
 * so a caller that retries on a timeout can get a 409 for its own first
 * attempt. The screen reports what came back rather than trying again.
 */
export async function resolveDamageReportAction(input: {
  brand: string
  id: string
  kind: Exclude<DamageResolutionKind, ''>
  note: string
}): Promise<ActionResult<DamageResolutionResult>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    return {
      ok: true,
      data: await resolveDamageReport({ token, ...input }),
    }
  } catch (err) {
    return failure(err)
  }
}

/**
 * Records that the ₹100 arrived, after a person looked at it.
 *
 * Retryable, unlike the two either side of it: it writes a flag and sends the
 * customer nothing, so a caller that retries on a timeout does no harm.
 */
export async function confirmDamagePaymentAction(input: {
  brand: string
  id: string
}): Promise<ActionResult<DamagePaymentResult>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    return { ok: true, data: await confirmDamagePayment({ token, ...input }) }
  } catch (err) {
    return failure(err)
  }
}

/**
 * Books the courier to collect the damaged parcel.
 *
 * NOT RETRYABLE, and the only action on this page that spends money. A
 * timeout here may have booked a shipment, so this reports what came back
 * and never tries again on its own — a second attempt is a second van.
 */
export async function bookDamagePickupAction(input: {
  brand: string
  id: string
}): Promise<ActionResult<DamagePickupResult>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    return { ok: true, data: await bookDamagePickup({ token, ...input }) }
  } catch (err) {
    return failure(err)
  }
}
