import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type BrandCreateInput,
  type BrandProfile,
  BrandProfileSchema,
  type BrandUpdateInput,
} from '@/lib/validators/brands'

const log = createLogger('BrandService')

const TIMEOUT_MS = 5_000

/**
 * Typed client for Tensor-Core's /brands endpoints.
 *
 * Server-only. Every call carries the admin's bearer token; the backend enforces
 * `brand:read` / `brand:manage` against it.
 */

export class BrandServiceError extends Error {}

async function request<T>(
  path: string,
  init: RequestInit,
  parse: (data: unknown) => T,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ path, err: error }, 'Tensor-Core is unreachable')
    throw new BrandServiceError('Tensor-Core is unreachable. Is the backend running?')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ path, status: response.status, detail }, 'Tensor-Core rejected the request')
    throw new BrandServiceError(detail ?? `Request failed (${response.status})`)
  }

  if (response.status === 204) return parse(undefined)
  return parse(await response.json())
}

function bearer(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

export async function listBrands(accessToken: string): Promise<BrandProfile[]> {
  return request('/brands', { headers: bearer(accessToken) }, data =>
    BrandProfileSchema.array().parse(data),
  )
}

export async function createBrand(
  accessToken: string,
  input: BrandCreateInput,
): Promise<BrandProfile> {
  return request(
    '/brands',
    { method: 'POST', headers: bearer(accessToken), body: JSON.stringify(input) },
    data => BrandProfileSchema.parse(data),
  )
}

export async function updateBrand(
  accessToken: string,
  slug: string,
  input: BrandUpdateInput,
): Promise<BrandProfile> {
  return request(
    `/brands/${encodeURIComponent(slug)}`,
    { method: 'PATCH', headers: bearer(accessToken), body: JSON.stringify(input) },
    data => BrandProfileSchema.parse(data),
  )
}

export async function deleteBrand(accessToken: string, slug: string): Promise<void> {
  await request(
    `/brands/${encodeURIComponent(slug)}`,
    { method: 'DELETE', headers: bearer(accessToken) },
    () => undefined,
  )
}
