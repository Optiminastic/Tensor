'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import type { DesignTemplate } from '@/lib/validators/registry'
import {
  deleteDesignTemplate,
  setTemplateSection,
  uploadDesignTemplate,
} from '@/services/design-templates.service'
import { RegistryServiceError } from '@/services/registry.service'

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
    revalidatePath(`/dashboard/${brand}/designs/registry`)
    return { ok: true, data: template }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof RegistryServiceError ? err.message : 'Could not upload the template.',
    }
  }
}

/**
 * Removes an uploaded design file.
 *
 * The backend decides whether it may go: it refuses while a product still
 * renders from the key and names which, and that sentence is what the dialog
 * shows. Checking it here as well would be a second rule to keep in step with
 * the first, and the one that matters is the one next to the database.
 */
export async function deleteDesignTemplateAction(
  brand: string,
  key: string,
): Promise<ActionResult<null>> {
  const { token, error } = await resolveBackendToken()
  if (!token) {
    return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }
  }
  try {
    await deleteDesignTemplate(token, key)
    revalidatePath(`/dashboard/${brand}/designs/registry`)
    return { ok: true, data: null }
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof RegistryServiceError ? err.message : 'Could not remove the design file.',
    }
  }
}

/**
 * Files a design file under a heading on the Designs tab.
 *
 * Sorting a list, not changing a product. Which file a product prints from is
 * set on that product, and nothing here touches it.
 */
export async function setTemplateSectionAction(
  brand: string,
  key: string,
  section: string,
): Promise<ActionResult<null>> {
  const { token, error } = await resolveBackendToken()
  if (!token) {
    return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }
  }
  try {
    await setTemplateSection(token, key, section)
    revalidatePath(`/dashboard/${brand}/designs/registry`)
    return { ok: true, data: null }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof RegistryServiceError ? err.message : 'Could not file that file.',
    }
  }
}
