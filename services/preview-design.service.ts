import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  PreviewDesignsResponseSchema,
  SKUReadinessResponseSchema,
  type PreviewDesign,
  type SKUReadiness,
} from '@/lib/validators/preview-design'

const log = createLogger('preview-design.service')

const TIMEOUT_MS = 15_000

/**
 * Which assembled file a product's personalisation preview is drawn from.
 *
 * The preview is a PICTURE, never a print: it shows the whole product the
 * customer receives - a lotus with its diya cup standing on it - while the
 * model that reaches a bed is the personalised part alone.
 *
 * Its own file rather than more of registry.service.ts, which is already at
 * the line limit, and because this is one small idea with three calls.
 */
export class PreviewDesignServiceError extends Error {}

async function call<T>(path: string, init: RequestInit, parse: (data: unknown) => T): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    log.warn({ path, error }, 'Tensor-Core is unreachable')
    throw new PreviewDesignServiceError('Could not reach Tensor-Core.')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ path, status: response.status, detail }, 'Tensor-Core rejected the request')
    // Passed through rather than replaced: when a file is refused, Tensor-Core
    // names the variables it does not declare, and that is the whole of the
    // fix. "Could not assign the preview file" names nothing.
    throw new PreviewDesignServiceError(detail ?? 'Could not use that preview file.')
  }

  const body = response.status === 204 ? undefined : await response.json()
  try {
    return parse(body)
  } catch (error) {
    log.warn({ path, error }, 'Tensor-Core sent a shape this does not expect')
    throw new PreviewDesignServiceError('Could not read the preview files.')
  }
}

function jsonHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

/** Which assembled file each colourway's preview is drawn from. */
export async function listPreviewDesigns(token: string, code: string): Promise<PreviewDesign[]> {
  return call(
    `/registry/products/${encodeURIComponent(code)}/preview-design`,
    { headers: { Authorization: `Bearer ${token}` } },
    data => PreviewDesignsResponseSchema.parse(data).items,
  )
}

interface PreviewDesignInput {
  template_key: string
  variant_sku?: string
}

/**
 * Points one colourway, or all of them, at an assembled file.
 *
 * The file itself is uploaded on the Designs tab, like every other .scad, so
 * there is one way a design enters Tensor. This only says which one the
 * picture comes from.
 */
export async function setPreviewDesign(
  token: string,
  code: string,
  input: PreviewDesignInput,
): Promise<void> {
  await call(
    `/registry/products/${encodeURIComponent(code)}/preview-design`,
    { method: 'PUT', headers: jsonHeaders(token), body: JSON.stringify(input) },
    () => null,
  )
}

/** Drops the assembled file, so the picture goes back to showing what prints. */
export async function clearPreviewDesign(
  token: string,
  code: string,
  variantSku?: string,
): Promise<void> {
  const scope = variantSku ? `?variant_sku=${encodeURIComponent(variantSku)}` : ''
  await call(
    `/registry/products/${encodeURIComponent(code)}/preview-design${scope}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
    () => null,
  )
}

/** What each child SKU still needs before an order can be made from it. */
export async function listSKUReadiness(token: string, code: string): Promise<SKUReadiness[]> {
  return call(
    `/registry/products/${encodeURIComponent(code)}/readiness`,
    { headers: { Authorization: `Bearer ${token}` } },
    data => SKUReadinessResponseSchema.parse(data).items,
  )
}
