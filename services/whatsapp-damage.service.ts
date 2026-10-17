import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type DamageReport,
  type DamageReportDetail,
  DamageReportDetailSchema,
  DamageReportSchema,
  type DamageReports,
  DamageReportsResponseSchema,
  type DamageStatus,
} from '@/lib/validators/whatsapp-damage'

const log = createLogger('WhatsAppDamageService')

const TIMEOUT_MS = 8_000

export class DamageServiceError extends Error {}

function reportsPath(brand: string): string {
  return `/brands/${encodeURIComponent(brand)}/damage-reports`
}

async function call(
  token: string,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<Response> {
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ path, err: error }, 'Tensor-Core is unreachable')
    throw new DamageServiceError('Tensor-Core is unreachable. Is the backend running?')
  }
  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    // The customer's number stays out of the log; a status is all a reader needs.
    log.warn({ status: response.status }, 'Tensor-Core rejected a damage-report request')
    throw new DamageServiceError(detail ?? `Request failed (${response.status})`)
  }
  return response
}

/** Every damage report for the brand, newest first, with the tab counts. */
export async function listDamageReports(token: string, brand: string): Promise<DamageReports> {
  const response = await call(token, reportsPath(brand))
  return DamageReportsResponseSchema.parse(await response.json())
}

/** One report and its photographs. */
export async function getDamageReport(
  token: string,
  brand: string,
  id: string,
): Promise<DamageReportDetail> {
  const response = await call(token, `${reportsPath(brand)}/${encodeURIComponent(id)}`)
  return DamageReportDetailSchema.parse(await response.json())
}

interface DamageUpdate {
  token: string
  brand: string
  id: string
  status?: DamageStatus
  resolution_note?: string
}

/** Moves a report along, records a resolution, or both. */
export async function updateDamageReport(update: DamageUpdate): Promise<DamageReport> {
  const { token, brand, id, ...body } = update
  const response = await call(token, `${reportsPath(brand)}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body,
  })
  return DamageReportSchema.parse(await response.json())
}

/**
 * One damage file's raw bytes, as a Response the route handler streams on.
 *
 * Deliberately not routed through `call`: that helper asks for JSON and reads
 * the body to find a `detail`, and this is a photograph or a video. The
 * status is passed back untouched so the page can tell "not on this report"
 * from "storage is down".
 */
export async function fetchDamageFile(
  token: string,
  brand: string,
  file: { reportId: string; fileId: string },
): Promise<Response> {
  const { reportId, fileId } = file
  const path =
    `${reportsPath(brand)}/${encodeURIComponent(reportId)}` + `/files/${encodeURIComponent(fileId)}`
  try {
    return await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ err: error }, 'Tensor-Core is unreachable')
    throw new DamageServiceError('Tensor-Core is unreachable. Is the backend running?')
  }
}
