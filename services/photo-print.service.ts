import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import { type PhotoPrint, PhotoPrintSchema, type PhotoSize } from '@/lib/validators/photo-print'
import { coreCall, coreHeaders, RegistryServiceError } from '@/services/registry.service'

const log = createLogger('PhotoPrintService')
const TIMEOUT_MS = 30_000

function base(code: string): string {
  return `/registry/products/${encodeURIComponent(code)}/photo-print`
}

/** A product's photo print sizes, the built-in ones and its sample PDF. */
export function getPhotoPrint(token: string, code: string): Promise<PhotoPrint> {
  return coreCall(base(code), { headers: { Authorization: `Bearer ${token}` } }, data =>
    PhotoPrintSchema.parse(data),
  )
}

/** Replaces the product's sizes; an empty list clears them. */
export function savePhotoSizes(
  token: string,
  code: string,
  sizes: PhotoSize[],
): Promise<PhotoPrint> {
  return coreCall(
    `${base(code)}/sizes`,
    { method: 'PUT', headers: coreHeaders(token), body: JSON.stringify({ sizes }) },
    data => PhotoPrintSchema.parse(data),
  )
}

/** Uploads the sample PDF. Multipart, so fetch sets its own boundary. */
export function uploadPhotoSample(
  token: string,
  code: string,
  form: FormData,
): Promise<PhotoPrint> {
  return coreCall(
    `${base(code)}/sample`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form },
    data => PhotoPrintSchema.parse(data),
  )
}

export function deletePhotoSample(token: string, code: string): Promise<PhotoPrint> {
  return coreCall(
    `${base(code)}/sample`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
    data => PhotoPrintSchema.parse(data),
  )
}

/** The sample PDF itself, for the download route to stream on. */
export async function fetchPhotoSample(token: string, code: string): Promise<Response> {
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${base(code)}/sample`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ code, err: error }, 'Tensor-Core is unreachable')
    throw new RegistryServiceError('Could not reach Tensor-Core.')
  }
  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    throw new RegistryServiceError(detail ?? 'Could not fetch the sample PDF.')
  }
  return response
}
