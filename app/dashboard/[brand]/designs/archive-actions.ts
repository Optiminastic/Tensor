'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import { archiveDesign, unarchiveDesign } from '@/services/designs-lifecycle.service'
import { DesignServiceError } from '@/services/designs.service'

import type { ActionResult } from './actions'

function describeError(err: unknown): string {
  return err instanceof DesignServiceError ? err.message : 'Something went wrong. Please try again.'
}

/**
 * Soft-delete a design (design:delete): it leaves every list view except
 * "Archived" and can be restored. Revalidates the list and the detail so the
 * change shows immediately.
 */
export async function archiveDesignForBrand(brand: string, id: string): Promise<ActionResult> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    await archiveDesign(token, id)
    revalidatePath(`/dashboard/${brand}/designs`)
    revalidatePath(`/dashboard/${brand}/designs/${id}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: describeError(err) }
  }
}

/** Restore an archived design back into the pipeline (as priced). design:delete. */
export async function unarchiveDesignForBrand(brand: string, id: string): Promise<ActionResult> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    await unarchiveDesign(token, id)
    revalidatePath(`/dashboard/${brand}/designs`)
    revalidatePath(`/dashboard/${brand}/designs/${id}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: describeError(err) }
  }
}
