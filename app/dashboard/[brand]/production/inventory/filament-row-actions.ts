'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import { FilamentEditSchema } from '@/lib/validators/filament-row'
import type { Filament } from '@/lib/validators/production'
import {
  FilamentRowsServiceError,
  deleteFilamentRow,
  updateFilamentRow,
} from '@/services/filament-rows.service'

import type { ActionResult } from '../actions'

function revalidateInventory(brand: string): void {
  revalidatePath(`/dashboard/${brand}/production/inventory`)
}

/** Edits a filament row in place, including its material and colour. */
export async function editFilament(
  brand: string,
  id: unknown,
  input: unknown,
): Promise<ActionResult<Filament>> {
  if (typeof id !== 'string' || id === '') return { ok: false, error: 'Choose a filament row.' }
  const parsed = FilamentEditSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the filament details.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const row = await updateFilamentRow(token, id, parsed.data)
    revalidateInventory(brand)
    return { ok: true, data: row }
  } catch (err) {
    const message =
      err instanceof FilamentRowsServiceError ? err.message : 'Could not save the filament.'
    return { ok: false, error: message }
  }
}

/** Removes a filament row from the shelf. */
export async function removeFilament(brand: string, id: unknown): Promise<ActionResult<null>> {
  if (typeof id !== 'string' || id === '') return { ok: false, error: 'Choose a filament row.' }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    await deleteFilamentRow(token, id)
    revalidateInventory(brand)
    return { ok: true, data: null }
  } catch (err) {
    const message =
      err instanceof FilamentRowsServiceError ? err.message : 'Could not remove the filament.'
    return { ok: false, error: message }
  }
}
