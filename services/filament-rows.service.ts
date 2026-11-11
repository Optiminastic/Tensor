// Server-only by placement (called from server actions).
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import type { FilamentEditInput } from '@/lib/validators/filament-row'
import { type Filament, FilamentSchema } from '@/lib/validators/production'

const log = createLogger('FilamentRowsService')
const TIMEOUT_MS = 15_000

/** Editing and deleting one filament row by id - the row menu on Inventory. */
export class FilamentRowsServiceError extends Error {}

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
    throw new FilamentRowsServiceError('Could not reach Tensor-Core.')
  }
  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ path, status: response.status, detail }, 'Tensor-Core rejected the request')
    throw new FilamentRowsServiceError(detail ?? 'Could not save the filament.')
  }
  if (response.status === 204) return parse(undefined)
  return parse(await response.json())
}

function jsonHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export async function updateFilamentRow(
  token: string,
  id: string,
  input: FilamentEditInput,
): Promise<Filament> {
  return call(
    `/filament-inventory/${encodeURIComponent(id)}`,
    { method: 'PATCH', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => FilamentSchema.parse(data),
  )
}

export async function deleteFilamentRow(token: string, id: string): Promise<void> {
  return call(
    `/filament-inventory/${encodeURIComponent(id)}`,
    { method: 'DELETE', headers: jsonHeaders(token) },
    () => undefined,
  )
}
