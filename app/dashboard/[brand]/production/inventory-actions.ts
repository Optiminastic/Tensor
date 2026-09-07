'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import { type InventoryItem, NewInventoryItemSchema } from '@/lib/validators/inventory'
import {
  InventoryServiceError,
  deleteInventoryItem as removeItem,
  saveInventoryItem,
} from '@/services/inventory.service'

interface ActionResult<T> {
  ok: boolean
  error?: string
  data?: T
}

/**
 * Records a non-filament item, or restocks one already on the shelf.
 *
 * The input is re-parsed here rather than trusted from the dialog: a server
 * action's arguments are client-controlled, so the unit in particular has to be
 * checked against the known set on this side too. The backend checks it a third
 * time - that is the one that actually guards the database.
 */
export async function addInventoryItem(
  brand: string,
  input: unknown,
): Promise<ActionResult<InventoryItem>> {
  const parsed = NewInventoryItemSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the item details.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const item = await saveInventoryItem(token, parsed.data)
    revalidatePath(`/dashboard/${brand}/production/inventory`)
    return { ok: true, data: item }
  } catch (err) {
    const message =
      err instanceof InventoryServiceError ? err.message : 'Could not save the inventory item.'
    return { ok: false, error: message }
  }
}

/** Removes an item from the shelf. A stock count, not a record of work, so it
 *  is a hard delete rather than an archive. */
export async function deleteInventoryItem(brand: string, id: string): Promise<ActionResult<never>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    await removeItem(token, id)
    revalidatePath(`/dashboard/${brand}/production/inventory`)
    return { ok: true }
  } catch (err) {
    const message =
      err instanceof InventoryServiceError ? err.message : 'Could not remove the inventory item.'
    return { ok: false, error: message }
  }
}
