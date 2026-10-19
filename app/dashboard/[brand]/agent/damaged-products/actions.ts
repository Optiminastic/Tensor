'use server'

import { resolveBackendToken } from '@/lib/backend-token'
import { createLogger } from '@/lib/logger'
import type {
  DamageReport,
  DamageReportDetail,
  DamageReports,
  DamageStatus,
} from '@/lib/validators/whatsapp-damage'
import {
  DamageServiceError,
  getDamageReport,
  listDamageReports,
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
