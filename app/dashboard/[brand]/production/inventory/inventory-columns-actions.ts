'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import {
  AddInventoryColumnSchema,
  type InventoryColumn,
  SetInventoryExtraSchema,
} from '@/lib/validators/inventory-columns'
import {
  InventoryColumnsServiceError,
  addInventoryColumn as addColumn,
  deleteInventoryColumn as deleteColumn,
  setInventoryExtra as setExtra,
} from '@/services/inventory-columns.service'

import type { ActionResult } from '../actions'

function revalidateInventory(brand: string): void {
  revalidatePath(`/dashboard/${brand}/production/inventory`)
}

function failure(err: unknown, fallback: string): { ok: false; error: string } {
  return { ok: false, error: err instanceof InventoryColumnsServiceError ? err.message : fallback }
}

/** Adds a custom column to a shelf. The backend validates the name again. */
export async function addInventoryColumn(
  brand: string,
  input: unknown,
): Promise<ActionResult<InventoryColumn>> {
  const parsed = AddInventoryColumnSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Give the column a name.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const column = await addColumn(token, parsed.data)
    revalidateInventory(brand)
    return { ok: true, data: column }
  } catch (err) {
    return failure(err, 'Could not add the column.')
  }
}

/** Removes a custom column and its value from every row on the shelf. */
export async function deleteInventoryColumn(
  brand: string,
  id: unknown,
): Promise<ActionResult<null>> {
  if (typeof id !== 'string' || id === '') return { ok: false, error: 'Choose a column.' }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    await deleteColumn(token, id)
    revalidateInventory(brand)
    return { ok: true, data: null }
  } catch (err) {
    return failure(err, 'Could not remove the column.')
  }
}

/** Writes one row's value for one custom column; an empty value clears it. */
export async function setInventoryExtra(
  brand: string,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = SetInventoryExtraSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'That value was not accepted.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    await setExtra(token, parsed.data)
    revalidateInventory(brand)
    return { ok: true, data: null }
  } catch (err) {
    return failure(err, 'Could not save the value.')
  }
}
