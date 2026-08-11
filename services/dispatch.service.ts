// Server-only by placement (called from server actions and server components).
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type DispatchCreateInput,
  type DispatchOrder,
  DispatchOrderSchema,
} from '@/lib/validators/dispatch'

const log = createLogger('DispatchService')
const TIMEOUT_MS = 15_000

/**
 * Typed client for Tensor-Core's /dispatch-orders endpoints (the shipment
 * record per order - the stage after packaging). Server-only; every call
 * carries the caller's bearer token and the backend enforces
 * dispatch:read / dispatch:manage against it.
 */
export class DispatchServiceError extends Error {}

async function call<T>(path: string, init: RequestInit, parse: (data: unknown) => T): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ path, err: error }, 'Tensor-Core is unreachable')
    throw new DispatchServiceError('Tensor-Core is unreachable. Is the backend running?')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ path, status: response.status, detail }, 'Tensor-Core rejected the request')
    throw new DispatchServiceError(detail ?? `Request failed (${response.status})`)
  }

  return parse(await response.json())
}

function jsonHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
}

export async function listDispatchOrders(token: string): Promise<DispatchOrder[]> {
  return call('/dispatch-orders', { headers: jsonHeaders(token) }, data =>
    DispatchOrderSchema.array().parse(data),
  )
}

export async function createDispatchOrder(
  token: string,
  input: DispatchCreateInput,
): Promise<DispatchOrder> {
  return call(
    '/dispatch-orders',
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => DispatchOrderSchema.parse(data),
  )
}

export async function markDispatched(token: string, id: string): Promise<DispatchOrder> {
  return call(
    `/dispatch-orders/${encodeURIComponent(id)}/dispatch`,
    { method: 'POST', headers: jsonHeaders(token) },
    data => DispatchOrderSchema.parse(data),
  )
}
