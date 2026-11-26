'use server'

import { resolveBackendToken } from '@/lib/backend-token'
import type { PhotoPrint, PhotoSize } from '@/lib/validators/photo-print'
import {
  deletePhotoSample,
  getPhotoPrint,
  savePhotoSizes,
  uploadPhotoSample,
} from '@/services/photo-print.service'
import { RegistryServiceError } from '@/services/registry.service'

import type { ActionResult } from './actions'

/**
 * A product's Photo print size: the size its customer photo prints at on the
 * Custom Photo sheets, and a sample PDF. Optional - most products have none.
 *
 * The product code is only a lookup key; every write is authorised by
 * Tensor-Core against registry:manage on the caller's own token.
 */
async function withToken(
  run: (token: string) => Promise<PhotoPrint>,
  fallback: string,
): Promise<ActionResult<PhotoPrint>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }
  try {
    return { ok: true, data: await run(token) }
  } catch (err) {
    return { ok: false, error: err instanceof RegistryServiceError ? err.message : fallback }
  }
}

export async function loadPhotoPrintAction(code: string): Promise<ActionResult<PhotoPrint>> {
  return withToken(token => getPhotoPrint(token, code), 'Could not load the photo print size.')
}

export async function savePhotoSizesAction(
  code: string,
  sizes: PhotoSize[],
): Promise<ActionResult<PhotoPrint>> {
  return withToken(token => savePhotoSizes(token, code, sizes), 'Could not save the photo sizes.')
}

export async function uploadPhotoSampleAction(
  code: string,
  form: FormData,
): Promise<ActionResult<PhotoPrint>> {
  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Choose the sample PDF.' }
  }
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return { ok: false, error: 'The sample is uploaded as a .pdf file.' }
  }
  return withToken(token => uploadPhotoSample(token, code, form), 'Could not upload the sample.')
}

export async function deletePhotoSampleAction(code: string): Promise<ActionResult<PhotoPrint>> {
  return withToken(token => deletePhotoSample(token, code), 'Could not remove the sample.')
}
