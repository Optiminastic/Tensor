// Server-only by placement (called from server actions and server components).
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type BulkOrder,
  BulkOrderListSchema,
  BulkOrderSchema,
  type BulkOrderInput,
  type SellableSku,
  SellableSkuListSchema,
} from '@/lib/validators/bulk-orders'

const log = createLogger('BulkOrderService')
const TIMEOUT_MS = 20_000

/**
 * Typed client for bulk orders and their quotations.
 *
 * Guarded by pricing:read / pricing:generate on the backend - a quotation is
 * pricing, so it uses the permissions that already mean "may see prices" and
 * "may set one" rather than a pair of its own.
 *
 * The write calls send SKUs, quantities and a discount percent, never money.
 * Tensor-Core resolves each price from Shopify and does the arithmetic, so the
 * totals on a quotation cannot be chosen by whoever posts the form.
 */
export class BulkOrderServiceError extends Error {}

async function call<T>(path: string, init: RequestInit, parse: (data: unknown) => T): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    log.warn({ path, error }, 'Tensor-Core is unreachable')
    throw new BulkOrderServiceError('Could not reach Tensor-Core.')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ path, status: response.status, detail }, 'Tensor-Core rejected the request')
    throw new BulkOrderServiceError(detail ?? 'Could not complete that request.')
  }

  if (response.status === 204) return parse(undefined)
  return parse(await response.json())
}

function bearer(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` }
}

function jsonHeaders(token: string): HeadersInit {
  return { ...bearer(token), 'Content-Type': 'application/json' }
}

function base(brand: string): string {
  return `/brands/${encodeURIComponent(brand)}/bulk-orders`
}

export async function listBulkOrders(token: string, brand: string): Promise<BulkOrder[]> {
  return call(base(brand), { headers: bearer(token) }, data => BulkOrderListSchema.parse(data))
}

export async function getBulkOrder(token: string, brand: string, id: string): Promise<BulkOrder> {
  return call(`${base(brand)}/${encodeURIComponent(id)}`, { headers: bearer(token) }, data =>
    BulkOrderSchema.parse(data),
  )
}

/** The products that may go on a line, with today's Shopify price beside each. */
export async function listSellableSkus(token: string, brand: string): Promise<SellableSku[]> {
  return call(`${base(brand)}/sellable-skus`, { headers: bearer(token) }, data =>
    SellableSkuListSchema.parse(data),
  )
}

export async function createBulkOrder(
  token: string,
  brand: string,
  input: BulkOrderInput,
): Promise<BulkOrder> {
  return call(
    base(brand),
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => BulkOrderSchema.parse(data),
  )
}

/** What an update needs. An options object because four positional arguments
 *  invite a caller to transpose the brand and the id, which are both strings. */
export interface UpdateBulkOrderOptions {
  token: string
  brand: string
  id: string
  input: BulkOrderInput
}

export async function updateBulkOrder(options: UpdateBulkOrderOptions): Promise<BulkOrder> {
  const { token, brand, id, input } = options
  return call(
    `${base(brand)}/${encodeURIComponent(id)}`,
    { method: 'PUT', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => BulkOrderSchema.parse(data),
  )
}

export async function deleteBulkOrder(token: string, brand: string, id: string): Promise<void> {
  await call(
    `${base(brand)}/${encodeURIComponent(id)}`,
    { method: 'DELETE', headers: bearer(token) },
    () => undefined,
  )
}
