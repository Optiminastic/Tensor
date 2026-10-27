import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type ExceptionActionResult,
  ExceptionActionResultSchema,
  type ShipmentExceptionsResponse,
  ShipmentExceptionsResponseSchema,
} from '@/lib/validators/shipment-exceptions'

const log = createLogger('ShipmentExceptionsService')

/**
 * Three Delhivery round trips, run in parallel by the backend, plus a cached
 * Shopify lookup to put order numbers on the rows. Generous because a timeout
 * renders as "could not load" on the page that says what is stuck.
 */
const READ_TIMEOUT_MS = 45_000

/** Acting is one small request, and a slow one must not be retried blindly. */
const ACT_TIMEOUT_MS = 15_000

export class ShipmentExceptionsServiceError extends Error {}

async function detailOf(response: Response): Promise<string | undefined> {
  return response
    .json()
    .then((body: { detail?: string }) => body.detail)
    .catch(() => undefined)
}

/**
 * Delhivery's exception queue for this brand, tab by tab.
 *
 * `connected: false` comes back as a NORMAL 200. A brand with no Delhivery One
 * credential is not an error state, and treating it as one would put a red
 * banner on a page that simply has not been set up yet.
 */
export async function listShipmentExceptions(
  token: string,
  brand: string,
  includeClosed = false,
): Promise<ShipmentExceptionsResponse> {
  const query = includeClosed ? '?include_closed=1' : ''
  const path = `/brands/${encodeURIComponent(brand)}/shipment-exceptions${query}`

  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(READ_TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ path, err: error }, 'Tensor-Core is unreachable')
    throw new ShipmentExceptionsServiceError('Tensor-Core is unreachable. Is the backend running?')
  }

  if (!response.ok) {
    const detail = await detailOf(response)
    log.warn({ path, status: response.status }, 'Tensor-Core rejected the exceptions request')
    throw new ShipmentExceptionsServiceError(
      detail ?? 'Delhivery would not answer for the exception queue.',
    )
  }

  const parsed = ShipmentExceptionsResponseSchema.safeParse(await response.json())
  if (!parsed.success) {
    log.error({ path, issues: parsed.error.issues }, 'Unexpected exceptions shape')
    throw new ShipmentExceptionsServiceError('Tensor-Core returned something unexpected.')
  }
  return parsed.data
}

/**
 * Presses one of Delhivery's own buttons on one row.
 *
 * The code is never invented here - it comes from the row's `actions`, which
 * come from Delhivery's `cta_list`. A hardcoded code table would go stale per
 * bucket and offer buttons the courier refuses.
 */
export async function actOnException(input: {
  token: string
  brand: string
  id: string
  code: string
  bucket: string
}): Promise<ExceptionActionResult> {
  const { token, brand, id, code, bucket } = input
  const path = `/brands/${encodeURIComponent(brand)}/shipment-exceptions/${encodeURIComponent(id)}/cta`

  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, bucket }),
      cache: 'no-store',
      signal: AbortSignal.timeout(ACT_TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ path, err: error }, 'Tensor-Core is unreachable')
    throw new ShipmentExceptionsServiceError(
      'Tensor-Core is unreachable, so nothing was sent to the courier.',
    )
  }

  if (!response.ok) {
    const detail = await detailOf(response)
    log.warn({ path, status: response.status }, 'Delhivery refused the action')
    // Delhivery's refusals name the parcel's state - "not in a pending state"
    // tells an operator the attempt already happened.
    throw new ShipmentExceptionsServiceError(detail ?? 'The courier would not take that.')
  }

  const parsed = ExceptionActionResultSchema.safeParse(await response.json())
  if (!parsed.success) {
    log.error({ path, issues: parsed.error.issues }, 'Unexpected action shape')
    throw new ShipmentExceptionsServiceError('Tensor-Core returned something unexpected.')
  }
  return parsed.data
}
