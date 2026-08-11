'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import { deleteDesign } from '@/services/designs-lifecycle.service'
import { DesignServiceError } from '@/services/designs.service'

import type { ActionResult } from './actions'

/**
 * Permanently remove a design (and its child records). The backend enforces
 * design:delete + brand access; on success the brand's design list is
 * revalidated so the deleted card disappears.
 */
export async function deleteDesignAction(brand: string, id: string): Promise<ActionResult> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    await deleteDesign(token, id)
    revalidatePath(`/dashboard/${brand}/designs`)
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof DesignServiceError ? err.message : 'Something went wrong. Please try again.',
    }
  }
}
