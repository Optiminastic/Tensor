// Server-only by placement (called from server actions and server components).
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type ColourMapEntry,
  type ColourMapPatch,
  type ColourMapUpsert,
  type LoadedColour,
  ColourMapEntrySchema,
  LoadedColourSchema,
} from '@/lib/validators/colour-map'

const log = createLogger('ColourMapService')
const TIMEOUT_MS = 15_000

/**
 * Typed client for Tensor-Core's colour map.
 *
 * It sits under /filament-inventory because that is what it describes, and it
 * is guarded by the same filament permissions — one Inventory page is one thing
 * to be allowed to read and to keep.
 */
export class ColourMapServiceError extends Error {}

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
    throw new ColourMapServiceError('Could not reach Tensor-Core.')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ path, status: response.status, detail }, 'Tensor-Core rejected the request')
    throw new ColourMapServiceError(detail ?? 'Could not read the colour map.')
  }

  if (response.status === 204) return parse(undefined)
  return parse(await response.json())
}

function jsonHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export async function listColourMap(token: string): Promise<ColourMapEntry[]> {
  return call('/filament-inventory/colour-map', { headers: jsonHeaders(token) }, data =>
    ColourMapEntrySchema.array().parse(data),
  )
}

/**
 * Every spool loaded across the fleet, and what the shop calls each one.
 *
 * This is the list that makes the map fillable: eleven of the fourteen hexes in
 * these machines are unknown to Tensor and to BambuBuddy's own catalogue, so
 * without it an operator would be typing hex codes by hand. It returns the
 * named ones too, because renaming a spool is as ordinary as naming it.
 */
export async function listLoadedColours(token: string): Promise<LoadedColour[]> {
  return call('/filament-inventory/colour-map/loaded', { headers: jsonHeaders(token) }, data =>
    LoadedColourSchema.array().parse(data),
  )
}

export async function upsertColourMapping(
  token: string,
  input: ColourMapUpsert,
): Promise<ColourMapEntry> {
  return call(
    '/filament-inventory/colour-map',
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => ColourMapEntrySchema.parse(data),
  )
}

/** Makes one recorded hex the swatch this colour renders as. */
export async function setColourMappingPrimary(token: string, id: string): Promise<ColourMapEntry> {
  return updateColourMapping(token, id, { is_primary: true })
}

/**
 * Corrects a recorded spool: which colour it belongs to, its value, or whether
 * it is the one that prints.
 */
export async function updateColourMapping(
  token: string,
  id: string,
  input: ColourMapPatch,
): Promise<ColourMapEntry> {
  return call(
    `/filament-inventory/colour-map/${encodeURIComponent(id)}`,
    { method: 'PATCH', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => ColourMapEntrySchema.parse(data),
  )
}

export async function deleteColourMapping(token: string, id: string): Promise<void> {
  return call(
    `/filament-inventory/colour-map/${encodeURIComponent(id)}`,
    { method: 'DELETE', headers: jsonHeaders(token) },
    () => undefined,
  )
}
