// Server-only by placement (called from server actions and server components).
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type ComponentPlate,
  ComponentPlateSchema,
  ComponentPlatesResponseSchema,
  type Component,
  ComponentSchema,
  type ComponentSourceWriteInput,
  type InventoryItem,
  InventoryItemListSchema,
  InventoryItemSchema,
  type NewInventoryItem,
} from '@/lib/validators/inventory'

const log = createLogger('InventoryService')
const TIMEOUT_MS = 15_000

/**
 * Typed client for the non-filament shelf: boxes, inserts, cards, tape.
 *
 * Separate from ProductionService because it is a separate endpoint group, but
 * guarded by the SAME filament permissions - the backend treats one Inventory
 * page as one thing to be allowed to read and to keep.
 */
export class InventoryServiceError extends Error {}

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
    throw new InventoryServiceError('Could not reach Tensor-Core.')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ path, status: response.status, detail }, 'Tensor-Core rejected the request')
    throw new InventoryServiceError(detail ?? 'Could not load inventory items.')
  }

  if (response.status === 204) return parse(undefined)
  return parse(await response.json())
}

function jsonHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export async function listInventoryItems(token: string): Promise<InventoryItem[]> {
  return call('/inventory-items', { headers: jsonHeaders(token) }, data =>
    InventoryItemListSchema.parse(data),
  )
}

/**
 * Records an item, or restocks one already on the shelf.
 *
 * The backend keys on the case-insensitive name, so submitting "Gift box" when
 * "Gift Box" exists updates that row rather than opening a second shelf for the
 * same thing. The quantity REPLACES what was there - the dialog asks how many
 * you have, not how many you are adding.
 */
export async function saveInventoryItem(
  token: string,
  input: NewInventoryItem,
): Promise<InventoryItem> {
  return call(
    '/inventory-items',
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => InventoryItemSchema.parse(data),
  )
}

/**
 * Edits an item in place, addressed by id.
 *
 * Separate from saveInventoryItem because that one is keyed on the NAME - it
 * restocks an existing shelf. Editing through it could not rename anything: a
 * new name would simply insert a second item and leave the old one behind.
 */
export async function updateInventoryItem(
  token: string,
  id: string,
  input: NewInventoryItem,
): Promise<InventoryItem> {
  return call(
    `/inventory-items/${id}`,
    { method: 'PATCH', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => InventoryItemSchema.parse(data),
  )
}

export async function deleteInventoryItem(token: string, id: string): Promise<void> {
  await call(
    `/inventory-items/${id}`,
    { method: 'DELETE', headers: jsonHeaders(token) },
    () => null,
  )
}

/** Declares how a component is made, and what prints it when the shop does. */
export async function setComponentSource(
  token: string,
  id: string,
  input: ComponentSourceWriteInput,
): Promise<void> {
  await call(
    `/registry/components/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    () => null,
  )
}

/**
 * Stores the mesh a printed component is made from.
 *
 * Marks the part printed and clears any template key on the way: a file
 * arriving here IS the answer to "what makes this", and the three facts are
 * one decision rather than three fields to keep in step.
 *
 * Multipart, so no Content-Type header - setting one would replace the
 * boundary fetch generates and the backend would read no file at all.
 */
export async function uploadComponentModel(
  token: string,
  id: string,
  form: FormData,
): Promise<Component> {
  return call(
    `/registry/components/${encodeURIComponent(id)}/model`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form },
    data => ComponentSchema.parse(data),
  )
}

/** The ready-made plates one component is replenished from. */
export async function listComponentPlates(token: string, id: string): Promise<ComponentPlate[]> {
  return call(
    `/registry/components/${encodeURIComponent(id)}/plates`,
    { headers: { Authorization: `Bearer ${token}` } },
    data => ComponentPlatesResponseSchema.parse(data).items,
  )
}

/**
 * Stores one machine class's finished plate.
 *
 * Multipart, so no Content-Type header - setting one here would replace the
 * boundary fetch generates and the backend would read no file at all.
 */
export async function uploadComponentPlate(
  token: string,
  target: { id: string; family: string },
  form: FormData,
): Promise<ComponentPlate> {
  // The SKU rides in the form, not the path: a SHARED plate has none, and an
  // empty path segment is not something a router can express.
  return call(
    `/registry/components/${encodeURIComponent(target.id)}/plates/${encodeURIComponent(target.family)}`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form },
    data => ComponentPlateSchema.parse(data),
  )
}

/** Removes a plate, returning that component to being sliced per run. */
export async function deleteComponentPlate(
  token: string,
  target: { id: string; sku: string; family: string },
): Promise<void> {
  const sku = target.sku === '' ? '' : `?sku=${encodeURIComponent(target.sku)}`
  await call(
    `/registry/components/${encodeURIComponent(target.id)}/plates/${encodeURIComponent(target.family)}${sku}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
    () => null,
  )
}
