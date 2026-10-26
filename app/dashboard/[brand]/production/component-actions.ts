'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import type {
  Component,
  ComponentPlate,
  ComponentSourceWriteInput,
} from '@/lib/validators/inventory'
import type { BomLine } from '@/lib/validators/registry'
import {
  deleteComponentPlate,
  InventoryServiceError,
  listComponentPlates,
  setComponentSource,
  uploadComponentModel,
  uploadComponentPlate,
} from '@/services/inventory.service'
import { getProductBom, RegistryServiceError, saveProductBom } from '@/services/registry.service'

import type { ActionResult } from './actions'

// Both, because a component's own routes are served by the inventory client
// and its bill of materials by the registry one. Either can carry the sentence
// Tensor-Core sent, and dropping it would turn a named refusal into "something
// went wrong".
function describe(err: unknown, fallback: string): string {
  if (err instanceof RegistryServiceError || err instanceof InventoryServiceError) {
    return err.message
  }
  return fallback
}

async function token(): Promise<{ token?: string; error?: string }> {
  const { token: t, error } = await resolveBackendToken()
  if (!t) return { error: error ?? 'Your session has expired. Sign in again.' }
  return { token: t }
}

function registryPath(brand: string): string {
  return `/dashboard/${brand}/designs/registry`
}

/** The bill of materials every SKU of a product inherits. */
export async function loadProductBom(code: string): Promise<ActionResult<BomLine[]>> {
  const { token: t, error } = await token()
  if (!t) return { ok: false, error }
  try {
    return { ok: true, data: await getProductBom(t, code) }
  } catch (err) {
    return { ok: false, error: describe(err, 'Could not load the components.') }
  }
}

/**
 * Replaces a product's components, whole.
 *
 * The whole list in one request rather than a line at a time: a kit is edited
 * as a list and saved once, so a half-applied edit cannot leave a product
 * carrying a box and no heart.
 */
export async function saveProductBomAction(
  target: { brand: string; code: string },
  lines: { item_id: string; quantity: number }[],
): Promise<ActionResult<BomLine[]>> {
  const { token: t, error } = await token()
  if (!t) return { ok: false, error }
  try {
    const saved = await saveProductBom(t, target.code, lines)
    revalidatePath(registryPath(target.brand))
    return { ok: true, data: saved }
  } catch (err) {
    return { ok: false, error: describe(err, 'Could not save the components.') }
  }
}

/** Declares whether a part is bought in or printed here, and what prints it. */
export async function setComponentSourceAction(
  target: { brand: string; id: string },
  input: ComponentSourceWriteInput,
): Promise<ActionResult<null>> {
  const { token: t, error } = await token()
  if (!t) return { ok: false, error }
  try {
    await setComponentSource(t, target.id, input)
    revalidatePath(registryPath(target.brand))
    return { ok: true, data: null }
  } catch (err) {
    return { ok: false, error: describe(err, 'Could not save how this part is made.') }
  }
}

/**
 * Uploads the mesh a printed component is made from.
 *
 * FormData rather than typed arguments because a File cannot cross the server
 * action boundary any other way.
 */
export async function uploadComponentModelAction(
  target: { brand: string; id: string },
  form: FormData,
): Promise<ActionResult<Component>> {
  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Choose the model to upload.' }
  }
  const name = file.name.toLowerCase()
  // Checked here too, so the obvious mistake - sending the .scad instead of
  // the mesh - is caught without a round trip.
  if (!name.endsWith('.stl') && !name.endsWith('.3mf')) {
    return {
      ok: false,
      error: 'A component’s model is an .stl or a .3mf, not the .scad that renders one.',
    }
  }
  const { token: t, error } = await token()
  if (!t) return { ok: false, error }
  try {
    const saved = await uploadComponentModel(t, target.id, form)
    revalidatePath(registryPath(target.brand))
    return { ok: true, data: saved }
  } catch (err) {
    return { ok: false, error: describe(err, 'Could not store the model.') }
  }
}

/** The ready-made plates a printed component is replenished from. */
export async function loadComponentPlates(id: string): Promise<ActionResult<ComponentPlate[]>> {
  const { token: t, error } = await token()
  if (!t) return { ok: false, error }
  try {
    return { ok: true, data: await listComponentPlates(t, id) }
  } catch (err) {
    return { ok: false, error: describe(err, 'Could not load this part’s plates.') }
  }
}

/**
 * Stores one machine class's finished plate.
 *
 * FormData rather than typed arguments because a File cannot cross the server
 * action boundary any other way.
 */
export async function uploadComponentPlateAction(
  target: { brand: string; id: string; sku: string; family: string },
  form: FormData,
): Promise<ActionResult<ComponentPlate>> {
  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Choose the sliced plate to upload.' }
  }
  const { token: t, error } = await token()
  if (!t) return { ok: false, error }
  try {
    form.append('sku', target.sku)
    const plate = await uploadComponentPlate(t, { id: target.id, family: target.family }, form)
    revalidatePath(registryPath(target.brand))
    return { ok: true, data: plate }
  } catch (err) {
    return { ok: false, error: describe(err, 'Could not store the plate.') }
  }
}

/** Removes a plate, returning that component to being sliced per run. */
export async function deleteComponentPlateAction(target: {
  brand: string
  id: string
  sku: string
  family: string
}): Promise<ActionResult<null>> {
  const { token: t, error } = await token()
  if (!t) return { ok: false, error }
  try {
    await deleteComponentPlate(t, { id: target.id, sku: target.sku, family: target.family })
    revalidatePath(registryPath(target.brand))
    return { ok: true, data: null }
  } catch (err) {
    return { ok: false, error: describe(err, 'Could not remove the plate.') }
  }
}
