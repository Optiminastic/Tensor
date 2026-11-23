'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import { type DesignFont, isFontFile } from '@/lib/validators/design-fonts'
import { uploadDesignFont } from '@/services/design-fonts.service'
import { RegistryServiceError } from '@/services/registry.service'

import type { ActionResult } from './actions'

/**
 * Uploads a font a design file names and Tensor does not have.
 *
 * Optional: a .scad on Tensor's own fonts needs none. When one is needed the
 * .scad upload is refused with the family to add, and this is how it is added.
 */
export async function uploadDesignFontAction(
  brand: string,
  form: FormData,
): Promise<ActionResult<DesignFont>> {
  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Choose a .ttf or .otf font file.' }
  }
  if (!isFontFile(file.name)) {
    return { ok: false, error: 'A font is uploaded as its .ttf or .otf file.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) {
    return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }
  }
  try {
    const font = await uploadDesignFont(token, form)
    revalidatePath(`/dashboard/${brand}/designs/registry`)
    return { ok: true, data: font }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof RegistryServiceError ? err.message : 'Could not upload the font.',
    }
  }
}
