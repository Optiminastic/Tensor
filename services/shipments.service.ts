import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type NdrAct,
  type NdrActionResult,
  NdrActionResultSchema,
  type ShipmentsResponse,
  ShipmentsResponseSchema,
} from '@/lib/validators/shipments'

const log = createLogger('ShipmentsService')

/**
 * Longer than the usual 5s, and deliberately so.
 *
 * One request behind this fans out to two upstreams: Shopify for a month of
 * fulfilments, then Delhivery for every waybill it found, fifty at a time. It
 * is all reads, so a slow one costs patience rather than correctness - and a
 * timeout here renders as "could not load" on a page whose whole job is to say
 * which parcels are stuck.
 */
const TIMEOUT_MS = 45_000

export class ShipmentsServiceError extends Error {}

/**
 * Every parcel this brand has shipped, and what the courier did with it.
 *
 * Nothing is filtered out by default - the whole window comes back, with the
 * deliveries that need attention sorted to the top. `reason` narrows to one
 * bucket, which is what the page's chips do; the counts stay whole-window
 * either way, so a selected chip keeps its number.
 */
export async function listShipments(
  token: string,
  brand: string,
  reason?: string,
): Promise<ShipmentsResponse> {
  const query = reason ? `?reason=${encodeURIComponent(reason)}` : ''
  const path = `/brands/${encodeURIComponent(brand)}/shipments${query}`

  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ path, err: error }, 'Tensor-Core is unreachable')
    throw new ShipmentsServiceError('Tensor-Core is unreachable. Is the backend running?')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ path, status: response.status }, 'Tensor-Core rejected the shipments request')
    // The upstream's own sentence, passed through: Shopify names the scope it
    // refused and Delhivery names the parameter it wanted, and that is what
    // the person reading the page can act on.
    throw new ShipmentsServiceError(detail ?? `Request failed (${response.status})`)
  }

  return ShipmentsResponseSchema.parse(await response.json())
}

/**
 * Tells the courier what to do about a parcel it could not deliver.
 *
 * A WRITE, unlike everything else in this file. It sends a van out again, or
 * changes where somebody's parcel goes, so the backend gates it on
 * dispatch:manage rather than the order:read the list runs on.
 *
 * SUBMITTED IS NOT DONE. Delhivery takes the instruction asynchronously and
 * answers with an upload id; the parcel has not moved. Callers must say
 * "asked" rather than "re-attempt booked" - the same mistake that left a
 * customer waiting for a payment message nobody sent.
 */
export async function actOnNdr(input: {
  token: string
  brand: string
  waybill: string
  act: NdrAct
  date?: string
  name?: string
  address?: string
  phone?: string
}): Promise<NdrActionResult> {
  const { token, brand, waybill, ...body } = input
  const path =
    `/brands/${encodeURIComponent(brand)}/shipments/` + `${encodeURIComponent(waybill)}/ndr`

  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
      // The courier's own timeout, not the 45s the list needs: this is one
      // small write, and a slow one means something is wrong at Delhivery.
      signal: AbortSignal.timeout(15_000),
    })
  } catch (error) {
    log.error({ err: error }, 'Tensor-Core is unreachable')
    throw new ShipmentsServiceError('Tensor-Core is unreachable. Is the backend running?')
  }
  if (!response.ok) {
    const detail = await response
      .json()
      .then((b: { detail?: string }) => b.detail)
      .catch(() => undefined)
    log.warn({ status: response.status, waybill }, 'the courier refused an NDR instruction')
    // Delhivery's refusals name the parcel's state - "waybill not in a
    // pending state" tells an operator the attempt already happened.
    throw new ShipmentsServiceError(detail ?? `Request failed (${response.status})`)
  }
  return NdrActionResultSchema.parse(await response.json())
}
