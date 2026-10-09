'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import type { ColourPart } from '@/lib/validators/registry'
import {
  RegistryServiceError,
  clearColourParts,
  listColourParts,
  setColourPartColour,
  uploadColourReference,
} from '@/services/registry.service'

import type { ActionResult } from './actions'

function describe(err: unknown, fallback: string): string {
  return err instanceof RegistryServiceError ? err.message : fallback
}

async function token(): Promise<{ token?: string; error?: string }> {
  const { token: t, error } = await resolveBackendToken()
  if (!t) return { error: error ?? 'Your session has expired. Sign in again.' }
  return { token: t }
}

/** Every configured coloured piece of a product, across its design files. */
export async function loadColourParts(code: string): Promise<ActionResult<ColourPart[]>> {
  const { token: t, error } = await token()
  if (!t) return { ok: false, error }
  try {
    return { ok: true, data: await listColourParts(t, code) }
  } catch (err) {
    return { ok: false, error: describe(err, 'Could not load the colour parts.') }
  }
}

/**
 * Reads a reference 3MF and replaces one design file's pieces with it.
 *
 * FormData rather than typed arguments because a File cannot cross the server
 * action boundary any other way.
 */
export async function uploadColourReferenceAction(
  target: { brand: string; code: string; role: string },
  form: FormData,
): Promise<ActionResult<ColourPart[]>> {
  const { brand, code, role } = target
  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Choose a .3mf file to upload.' }
  }
  // Checked here as well as in the backend so the obvious mistake - sending
  // the .scad that renders the model instead of the model - is caught without
  // a round trip.
  if (!file.name.toLowerCase().endsWith('.3mf')) {
    return {
      ok: false,
      error: 'A colour reference is a .3mf exported from the slicer, not the .scad.',
    }
  }

  const { token: t, error } = await token()
  if (!t) return { ok: false, error }
  try {
    const parts = await uploadColourReference(t, { code, role }, form)
    revalidatePath(`/dashboard/${brand}/production/registry`)
    return { ok: true, data: parts }
  } catch (err) {
    return { ok: false, error: describe(err, 'Could not read that 3MF.') }
  }
}

/** Moves one piece between a fixed colour and the customer's choice. */
export async function setColourPartColourAction(
  brand: string,
  id: string,
  colourHex: string,
): Promise<ActionResult<ColourPart>> {
  const { token: t, error } = await token()
  if (!t) return { ok: false, error }
  try {
    const part = await setColourPartColour(t, id, colourHex)
    revalidatePath(`/dashboard/${brand}/production/registry`)
    return { ok: true, data: part }
  } catch (err) {
    return { ok: false, error: describe(err, 'Could not update the colour part.') }
  }
}

/** Returns one design file to the default white-base, coloured-lettering pair. */
export async function clearColourPartsAction(
  brand: string,
  code: string,
  role: string,
): Promise<ActionResult<null>> {
  const { token: t, error } = await token()
  if (!t) return { ok: false, error }
  try {
    await clearColourParts(t, code, role)
    revalidatePath(`/dashboard/${brand}/production/registry`)
    return { ok: true, data: null }
  } catch (err) {
    return { ok: false, error: describe(err, 'Could not clear the colour parts.') }
  }
}
