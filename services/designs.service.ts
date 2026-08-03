// Server-only by placement (called from server actions and server components).
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type Design,
  type DesignDetail,
  type DesignReview,
  type DesignSpecs,
  type PublishInput,
  type PublishResult,
  type ResubmitInput,
  DesignDetailSchema,
  DesignReviewSchema,
  DesignSchema,
  PublishResultSchema,
} from '@/lib/validators/designs'

const log = createLogger('DesignService')

// Slicing is async; only these calls hit the network synchronously and they are
// small, so a short timeout is right. The slice itself runs in the worker.
const TIMEOUT_MS = 15_000

// Downloadable files stream through this process to the browser, so they get a
// longer ceiling than the small JSON calls.
const FILE_TIMEOUT_MS = 60_000

// A model upload streams a large file (up to 60 MB) through this process to the
// backend and on to object storage - far beyond the small-JSON timeout, so it
// gets a generous ceiling to avoid aborting a legitimate upload mid-stream.
const UPLOAD_TIMEOUT_MS = 5 * 60_000

// A design's streamable files: the original uploaded model, the G-code archive
// from its latest slice, the cover preview image, and the extracted plate G-code
// text the layer preview renders from.
export type DesignFileKind = 'model' | 'gcode' | 'preview' | 'plate'

// Frontend kind -> Tensor-Core sub-path. Most map one-to-one; the layer preview
// reads the plate G-code text served at the nested /gcode/plate route.
const KIND_PATHS: Record<DesignFileKind, string> = {
  model: 'model',
  gcode: 'gcode',
  preview: 'preview',
  plate: 'gcode/plate',
}

/**
 * Typed client for Tensor-Core's /designs endpoints. Server-only. Every call
 * carries the caller's bearer token; the backend enforces design:* against it.
 */
export class DesignServiceError extends Error {}

async function call<T>(path: string, init: RequestInit, parse: (data: unknown) => T): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      ...init,
      cache: 'no-store',
      // A caller can pass its own signal (e.g. a longer upload timeout); otherwise
      // the small-JSON default applies.
      signal: init.signal ?? AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ path, err: error }, 'Tensor-Core is unreachable')
    throw new DesignServiceError('Tensor-Core is unreachable. Is the backend running?')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ path, status: response.status, detail }, 'Tensor-Core rejected the request')
    throw new DesignServiceError(detail ?? `Request failed (${response.status})`)
  }

  if (response.status === 204) return parse(undefined)
  return parse(await response.json())
}

function authHeader(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, Accept: 'application/json' }
}

function jsonHeaders(token: string): HeadersInit {
  return { ...authHeader(token), 'Content-Type': 'application/json' }
}

export async function listDesigns(token: string, brand: string): Promise<Design[]> {
  return call(
    `/designs?brand=${encodeURIComponent(brand)}`,
    { headers: jsonHeaders(token) },
    data => DesignSchema.array().parse(data),
  )
}

export async function getDesign(token: string, id: string): Promise<DesignDetail> {
  return call(`/designs/${encodeURIComponent(id)}`, { headers: jsonHeaders(token) }, data =>
    DesignDetailSchema.parse(data),
  )
}

export interface CreateDesignInput {
  brand: string
  name: string
  specs: DesignSpecs
  file: File
  preview: File
  notes?: string
}

// createDesign sends multipart/form-data: Content-Type is left unset so fetch
// adds the boundary itself.
export async function createDesign(token: string, input: CreateDesignInput): Promise<Design> {
  const form = new FormData()
  form.set('brand', input.brand)
  form.set('name', input.name)
  form.set('material', input.specs.material)
  if (input.specs.colour) form.set('colour', input.specs.colour)
  form.set('finish', input.specs.finish)
  form.set('units_per_bed', String(input.specs.units_per_bed))
  form.set('quality', input.specs.quality)
  form.set('infill_pct', String(input.specs.infill_pct))
  if (input.notes) form.set('notes', input.notes)
  form.set('file', input.file, input.file.name)
  form.set('preview', input.preview, input.preview.name)

  return call(
    '/designs',
    {
      method: 'POST',
      headers: authHeader(token),
      body: form,
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    },
    data => DesignSchema.parse(data),
  )
}

/**
 * Fetches one of a design's downloadable files (original model or sliced G-code)
 * as a raw streaming Response. Unlike the JSON calls it returns the Response
 * untouched so a route handler can pipe the bytes straight to the browser.
 * Throws DesignServiceError on a network failure or a non-OK status (the
 * backend's `detail` message is preserved).
 */
export async function fetchDesignFile(
  token: string,
  id: string,
  kind: DesignFileKind,
): Promise<Response> {
  let response: Response
  try {
    response = await fetch(
      `${env.TENSOR_CORE_URL}/designs/${encodeURIComponent(id)}/${KIND_PATHS[kind]}`,
      {
        headers: authHeader(token),
        cache: 'no-store',
        signal: AbortSignal.timeout(FILE_TIMEOUT_MS),
      },
    )
  } catch (error) {
    log.error({ id, kind, err: error }, 'Tensor-Core is unreachable')
    throw new DesignServiceError('Tensor-Core is unreachable. Is the backend running?')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn(
      { id, kind, status: response.status, detail },
      'Tensor-Core rejected the file download',
    )
    throw new DesignServiceError(detail ?? `Request failed (${response.status})`)
  }

  return response
}

export interface PublishToShopifyParams {
  id: string
  input: PublishInput
  images: File[]
}

// Approves a priced design and creates its Shopify draft product in one call.
// Sends multipart/form-data so product images ride along; Content-Type is left
// unset so fetch adds the boundary itself.
export async function publishToShopify(
  token: string,
  { id, input, images }: PublishToShopifyParams,
): Promise<PublishResult> {
  const form = new FormData()
  form.set('title', input.title)
  form.set('price', String(input.price))
  const optional: Record<string, string | undefined> = {
    product_type: input.product_type,
    tags: input.tags?.length ? input.tags.join(', ') : undefined,
    vendor: input.vendor,
    description: input.description,
    seo_title: input.seo_title,
    seo_description: input.seo_description,
    sku: input.sku,
    weight_grams: input.weight_grams !== undefined ? String(input.weight_grams) : undefined,
  }
  for (const [key, value] of Object.entries(optional)) {
    if (value !== undefined) form.set(key, value)
  }
  for (const image of images) form.append('images', image, image.name)

  return call(
    `/designs/${encodeURIComponent(id)}/publish-shopify`,
    { method: 'POST', headers: authHeader(token), body: form },
    data => PublishResultSchema.parse(data),
  )
}

export async function resubmitDesign(
  token: string,
  id: string,
  input: ResubmitInput,
): Promise<Design> {
  return call(
    `/designs/${encodeURIComponent(id)}/resubmit`,
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => DesignSchema.parse(data),
  )
}

// Assigns (or clears, with an empty string) the design's catalog SKU. The backend
// owns uniqueness and returns a 409 (surfaced as the thrown error's message) when
// the SKU is already used by another design.
export async function setDesignSku(token: string, id: string, sku: string): Promise<Design> {
  return call(
    `/designs/${encodeURIComponent(id)}/sku`,
    { method: 'PATCH', headers: jsonHeaders(token), body: JSON.stringify({ sku }) },
    data => DesignSchema.parse(data),
  )
}

// --- Review workflow: submit -> review (comment / reject) -> approve ----------

// Sends a POST with a JSON body to a /designs/:id/<action> route and parses the
// returned design (the backend echoes the design with its new status).
function designAction(token: string, path: string, body: unknown): Promise<Design> {
  return call(
    path,
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(body) },
    data => DesignSchema.parse(data),
  )
}

export async function submitDesign(token: string, id: string, message?: string): Promise<Design> {
  return designAction(token, `/designs/${encodeURIComponent(id)}/submit`, { message })
}

export async function approveDesign(
  token: string,
  id: string,
  approvedSp?: number,
): Promise<Design> {
  return designAction(token, `/designs/${encodeURIComponent(id)}/approve`, {
    approved_sp: approvedSp,
  })
}

export async function rejectDesign(token: string, id: string, comment: string): Promise<Design> {
  return designAction(token, `/designs/${encodeURIComponent(id)}/reject`, { comment })
}

export async function commentOnDesign(
  token: string,
  id: string,
  body: string,
): Promise<DesignReview> {
  return call(
    `/designs/${encodeURIComponent(id)}/comments`,
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify({ body }) },
    data => DesignReviewSchema.parse(data),
  )
}

export async function listDesignReviews(token: string, id: string): Promise<DesignReview[]> {
  return call(`/designs/${encodeURIComponent(id)}/reviews`, { headers: jsonHeaders(token) }, data =>
    DesignReviewSchema.array().parse(data),
  )
}
