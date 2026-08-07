// Server-only by placement (called from server actions and server components).
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type Design,
  type DesignDetail,
  type DesignMachine,
  type DesignMachineSpec,
  type DesignOptimization,
  type DesignReview,
  type DesignSpecs,
  type PersonalisationEstimate,
  type PersonalisationRules,
  type PublishInput,
  type PublishResult,
  type ResubmitInput,
  DesignDetailSchema,
  DesignMachineSchema,
  DesignOptimizationSchema,
  DesignReviewSchema,
  DesignSchema,
  PersonalisationEstimateSchema,
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
export type DesignFileKind = 'model' | 'model-lite' | 'gcode' | 'preview' | 'plate' | 'report'

// Frontend kind -> Tensor-Core sub-path. Most map one-to-one; the layer preview
// reads the plate G-code text served at the nested /gcode/plate route.
const KIND_PATHS: Record<DesignFileKind, string> = {
  model: 'model',
  'model-lite': 'model-lite',
  gcode: 'gcode',
  preview: 'preview',
  plate: 'gcode/plate',
  report: 'report.pdf',
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
  machine: DesignMachineSpec
  file: File
  preview: File
  notes?: string
  attributes?: Record<string, string>
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
  form.set('left_nozzle_mm', String(input.machine.left_nozzle_mm))
  form.set('right_nozzle_mm', String(input.machine.right_nozzle_mm))
  form.set('left_flow', input.machine.left_flow)
  form.set('right_flow', input.machine.right_flow)
  if (input.notes) form.set('notes', input.notes)
  if (input.attributes) {
    for (const [key, value] of Object.entries(input.attributes)) form.set(key, value)
  }
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

/**
 * Streams the personalized preview model - the design's model with the customer's
 * name rendered as real embossed geometry (backend OpenSCAD). `search` is the raw
 * query string (text, size_mm, depth_mm, offset_*_mm), forwarded verbatim. Like
 * fetchDesignFile it returns the raw Response so the route handler can pipe bytes.
 */
export async function fetchPersonalisePreview(
  token: string,
  id: string,
  search: string,
): Promise<Response> {
  let response: Response
  try {
    response = await fetch(
      `${env.TENSOR_CORE_URL}/designs/${encodeURIComponent(id)}/personalise-preview${search}`,
      {
        headers: authHeader(token),
        cache: 'no-store',
        signal: AbortSignal.timeout(FILE_TIMEOUT_MS),
      },
    )
  } catch (error) {
    log.error({ id, err: error }, 'Tensor-Core is unreachable')
    throw new DesignServiceError('Tensor-Core is unreachable. Is the backend running?')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn(
      { id, status: response.status, detail },
      'Tensor-Core rejected the personalise preview',
    )
    throw new DesignServiceError(detail ?? `Request failed (${response.status})`)
  }

  return response
}

// Emails the design's cost-report PDF to a recipient. Returns { sent, to } on
// success; the backend 503s when SMTP is not configured.
export async function emailDesignReport(
  token: string,
  id: string,
  to: string,
): Promise<{ sent: boolean; to: string }> {
  return call(
    `/designs/${encodeURIComponent(id)}/email-report`,
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify({ to }) },
    data => data as { sent: boolean; to: string },
  )
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

// Stores what personalization a product offers (null clears it). The backend
// validates the rule shape.
export async function setDesignPersonalisationRules(
  token: string,
  id: string,
  rules: PersonalisationRules | null,
): Promise<Design> {
  return call(
    `/designs/${encodeURIComponent(id)}/personalisation-rules`,
    { method: 'PATCH', headers: jsonHeaders(token), body: JSON.stringify({ rules }) },
    data => DesignSchema.parse(data),
  )
}

export interface EstimatePersonalisationInput {
  text: string
  height_mm?: number
  depth_mm?: number
}

// The AI optimizer calls an LLM, so it gets a generous ceiling well beyond the
// small-JSON default.
const OPTIMIZE_TIMEOUT_MS = 90_000

// Runs the nozzle-aware AI optimization advisor for a costed design and returns
// its structured report (verdict, filament, support, ranked recommendations). The
// backend caches per (design, inputs), so a repeat call for the same inputs is fast.
export async function getDesignOptimization(
  token: string,
  id: string,
): Promise<DesignOptimization> {
  return call(
    `/designs/${encodeURIComponent(id)}/optimize`,
    {
      method: 'POST',
      headers: jsonHeaders(token),
      signal: AbortSignal.timeout(OPTIMIZE_TIMEOUT_MS),
    },
    data => DesignOptimizationSchema.parse(data),
  )
}

// Fast pre-slice estimate of what a name adds to a product (grams, time, cost).
// Read-only on the backend; the authoritative numbers come from the slice.
export async function estimatePersonalisation(
  token: string,
  id: string,
  input: EstimatePersonalisationInput,
): Promise<PersonalisationEstimate> {
  return call(
    `/designs/${encodeURIComponent(id)}/personalisation-estimate`,
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => PersonalisationEstimateSchema.parse(data),
  )
}

// updateDesignMachine relinks a design to whichever machine_profiles row
// matches the given dual-nozzle config (finding or creating one, same as
// design creation) - the "Machine" tab's edit form.
export async function updateDesignMachine(
  token: string,
  id: string,
  input: DesignMachineSpec,
): Promise<DesignMachine> {
  return call(
    `/designs/${encodeURIComponent(id)}/machine`,
    { method: 'PATCH', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => DesignMachineSchema.parse(data),
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
