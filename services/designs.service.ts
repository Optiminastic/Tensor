// Server-only by placement (called from server actions and server components).
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type Design,
  type DesignDetail,
  type DesignSpecs,
  DesignDetailSchema,
  DesignSchema,
} from '@/lib/validators/designs'

const log = createLogger('DesignService')

// Slicing is async; only these calls hit the network synchronously and they are
// small, so a short timeout is right. The slice itself runs in the worker.
const TIMEOUT_MS = 15_000

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
      signal: AbortSignal.timeout(TIMEOUT_MS),
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
  form.set('file', input.file, input.file.name)

  return call('/designs', { method: 'POST', headers: authHeader(token), body: form }, data =>
    DesignSchema.parse(data),
  )
}

export async function resubmitDesign(
  token: string,
  id: string,
  specs: DesignSpecs,
): Promise<Design> {
  return call(
    `/designs/${encodeURIComponent(id)}/resubmit`,
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(specs) },
    data => DesignSchema.parse(data),
  )
}
