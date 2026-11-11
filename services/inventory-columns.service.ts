// Server-only by placement (called from server actions and server components).
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type InventoryColumn,
  InventoryColumnListSchema,
  InventoryColumnSchema,
  type InventoryShelf,
  type SetInventoryExtraInput,
} from '@/lib/validators/inventory-columns'

const log = createLogger('InventoryColumnsService')
const TIMEOUT_MS = 15_000

/** Where each shelf's rows live, for writing one row's custom value. */
const ROW_PATHS: Record<InventoryShelf, string> = {
  filament: '/filament-inventory',
  items: '/inventory-items',
}

/** Typed client for the custom columns on the two inventory shelves. */
export class InventoryColumnsServiceError extends Error {}

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
    throw new InventoryColumnsServiceError('Could not reach Tensor-Core.')
  }
  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ path, status: response.status, detail }, 'Tensor-Core rejected the request')
    throw new InventoryColumnsServiceError(detail ?? 'Could not update the custom columns.')
  }
  if (response.status === 204) return parse(undefined)
  return parse(await response.json())
}

function jsonHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export async function listInventoryColumns(
  token: string,
  shelf: InventoryShelf,
): Promise<InventoryColumn[]> {
  return call(`/inventory-columns?shelf=${shelf}`, { headers: jsonHeaders(token) }, data =>
    InventoryColumnListSchema.parse(data),
  )
}

export async function addInventoryColumn(
  token: string,
  input: { shelf: InventoryShelf; name: string },
): Promise<InventoryColumn> {
  return call(
    '/inventory-columns',
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => InventoryColumnSchema.parse(data),
  )
}

export async function deleteInventoryColumn(token: string, id: string): Promise<void> {
  return call(
    `/inventory-columns/${encodeURIComponent(id)}`,
    { method: 'DELETE', headers: jsonHeaders(token) },
    () => undefined,
  )
}

export async function setInventoryExtra(
  token: string,
  input: SetInventoryExtraInput,
): Promise<void> {
  return call(
    `${ROW_PATHS[input.shelf]}/${encodeURIComponent(input.rowId)}/extra`,
    {
      method: 'PATCH',
      headers: jsonHeaders(token),
      body: JSON.stringify({ column: input.column, value: input.value }),
    },
    () => undefined,
  )
}
