import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type DamagePaymentResult,
  DamagePaymentResultSchema,
  type DamagePickupResult,
  DamagePickupResultSchema,
  type DamageReport,
  type DamageReportDetail,
  DamageReportDetailSchema,
  DamageReportSchema,
  type DamageResolutionKind,
  DamageResolutionResultSchema,
  type DamageResolutionResult,
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
 * Decides what happens to a damaged parcel: reprint it at our cost, or offer
 * the customer the ₹100 reverse pickup.
 *
 * A SEPARATE CALL from updateDamageReport, because it is a separate decision
 * with a separate permission (damage:resolve) and a side effect that one has
 * not got: choosing a reprint messages the customer. The backend records it
 * once and refuses a second, so this is not idempotent and must not be
 * retried blindly.
 */
export interface DamageResolution {
  token: string
  brand: string
  id: string
  /** Never `''` — that is the absence of a decision, not one of them. */
  kind: Exclude<DamageResolutionKind, ''>
  note: string
}

export async function resolveDamageReport(
  input: DamageResolution,
): Promise<DamageResolutionResult> {
  const { token, brand, id, ...body } = input
  const response = await call(token, `${reportsPath(brand)}/${encodeURIComponent(id)}/resolution`, {
    method: 'POST',
    body,
  })
  return DamageResolutionResultSchema.parse(await response.json())
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

/**
 * Records that the customer's ₹100 arrived.
 *
 * SOMEBODY LOOKED AT THE MONEY. There is no automatic version of this and
 * there is not meant to be: a screenshot is a picture of a screen, and a
 * person checking the bank is the reason support is in this flow at all.
 *
 * Reversible, unlike the booking that follows it, which is why they are two
 * calls rather than one.
 */
export async function confirmDamagePayment(input: {
  token: string
  brand: string
  id: string
}): Promise<DamagePaymentResult> {
  const { token, brand, id } = input
  const response = await call(token, `${reportsPath(brand)}/${encodeURIComponent(id)}/payment`, {
    method: 'POST',
  })
  return DamagePaymentResultSchema.parse(await response.json())
}

/**
 * Books the courier to collect the damaged parcel.
 *
 * THE ONE CALL HERE THAT SPENDS MONEY AND CANNOT BE TAKEN BACK — it puts a van
 * outside somebody's house. Everything before it is a row in a database.
 *
 * NOT RETRYABLE. A timeout may well have booked a shipment; calling again
 * would book a second. On anything other than a clean answer the screen says
 * what happened and leaves it to a person, because the only way back is
 * cancelling a waybill at Delhivery.
 */
export async function bookDamagePickup(input: {
  token: string
  brand: string
  id: string
}): Promise<DamagePickupResult> {
  const { token, brand, id } = input
  const response = await call(token, `${reportsPath(brand)}/${encodeURIComponent(id)}/pickup`, {
    method: 'POST',
  })
  return DamagePickupResultSchema.parse(await response.json())
}

/**
 * Removes a report from the board, and its timeline with it.
 *
 * ADMIN ONLY, and the backend is what enforces that - hiding the button is
 * UX. Support decides what the shop does about a complaint; erasing the
 * record that a customer complained is a different act.
 *
 * REFUSED WHEN A COURIER IS ALREADY BOOKED, with the waybill in the message,
 * because this report is the only place that number is written down.
 */
export async function deleteDamageReport(input: {
  token: string
  brand: string
  id: string
}): Promise<void> {
  const { token, brand, id } = input
  await call(token, `${reportsPath(brand)}/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
