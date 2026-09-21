'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import { type ColourMapEntry, ColourMapUpsertSchema } from '@/lib/validators/colour-map'
import {
  ColourMapServiceError,
  deleteColourMapping,
  setColourMappingPrimary,
  upsertColourMapping,
} from '@/services/colour-map.service'

import type { ActionResult } from '../actions'

/**
 * Records "this hex is our BLUE".
 *
 * The backend canonicalises the name and validates the hex, which matters
 * because a server action's arguments are client-controlled — the form is a
 * convenience, not the rule.
 */
export async function addColourMapping(
  brand: string,
  input: unknown,
): Promise<ActionResult<ColourMapEntry>> {
  const parsed = ColourMapUpsertSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Name the colour and give its value.',
    }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const entry = await upsertColourMapping(token, parsed.data)
    revalidateColourMap(brand)
    return { ok: true, data: entry }
  } catch (err) {
    const message =
      err instanceof ColourMapServiceError ? err.message : 'Could not record that colour.'
    return { ok: false, error: message }
  }
}

/** Makes one recorded hex the swatch this colour renders and prints as. */
export async function makeColourPrimary(
  brand: string,
  id: string,
): Promise<ActionResult<ColourMapEntry>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const entry = await setColourMappingPrimary(token, id)
    revalidateColourMap(brand)
    return { ok: true, data: entry }
  } catch (err) {
    const message =
      err instanceof ColourMapServiceError ? err.message : 'Could not change the primary colour.'
    return { ok: false, error: message }
  }
}

export async function removeColourMapping(brand: string, id: string): Promise<ActionResult<null>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    await deleteColourMapping(token, id)
    revalidateColourMap(brand)
    return { ok: true, data: null }
  } catch (err) {
    const message =
      err instanceof ColourMapServiceError ? err.message : 'Could not remove that colour.'
    return { ok: false, error: message }
  }
}

// The map changes what a bed's colours resolve to, so the queue dialog and the
// machine board are as stale as the Inventory page after an edit.
function revalidateColourMap(brand: string): void {
  revalidatePath(`/dashboard/${brand}/production/inventory`)
  revalidatePath(`/dashboard/${brand}/production/machines`)
}
