'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import { editDesignDescription } from '@/services/designs-lifecycle.service'
import { DesignServiceError } from '@/services/designs.service'

import type { ActionResult } from './actions'

const MAX_DESCRIPTION = 8000

/**
 * Write the product marketing description on a design (design:content) - the
 * Marketing Head's one write. Empty clears it. The backend re-enforces the
 * permission and brand access; the publish dialog pre-fills from the stored value.
 */
export async function editDescriptionForBrand(
  brand: string,
  id: string,
  description: string,
): Promise<ActionResult> {
  if (description.length > MAX_DESCRIPTION) {
    return { ok: false, error: `Description must be ${MAX_DESCRIPTION} characters or fewer.` }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    await editDesignDescription(token, id, description)
    revalidatePath(`/dashboard/${brand}/designs/${id}`)
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof DesignServiceError ? err.message : 'Something went wrong. Please try again.',
    }
  }
}
