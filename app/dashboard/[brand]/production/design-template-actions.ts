'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import type { DesignTemplate } from '@/lib/validators/registry'
import { RegistryServiceError, uploadDesignTemplate } from '@/services/registry.service'

import type { ActionResult } from './actions'

/**
 * Replaces the OpenSCAD template a product renders from.
 *
 * The three plank templates are compiled into the backend, so changing one has
 * always meant a developer and a deploy - and the embedded copies drifted five
 * days behind the shop's own masters without anyone noticing. An upload here
 * becomes the file the renderer uses, immediately and for every plank after it.
 *
 * FormData rather than typed arguments because a File cannot cross the server
 * action boundary any other way.
 */
export async function uploadDesignTemplateAction(
  brand: string,
  key: string,
  form: FormData,
): Promise<ActionResult<DesignTemplate>> {
  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Choose a .scad file to upload.' }
  }
  // Checked here as well as in the backend so the obvious mistake - sending the
  // rendered model instead of the template that renders it - is caught without
  // a round trip carrying a multi-megabyte STL.
  if (!file.name.toLowerCase().endsWith('.scad')) {
    return {
      ok: false,
      error: 'A template is an OpenSCAD .scad file, not the model it renders.',
    }
  }

  const { token, error } = await resolveBackendToken()
  if (!token) {
    return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }
  }

  try {
    const template = await uploadDesignTemplate(token, key, form)
    revalidatePath(`/dashboard/${brand}/production/registry`)
    return { ok: true, data: template }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof RegistryServiceError ? err.message : 'Could not upload the template.',
    }
  }
}
