import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import { type Integration, IntegrationsResponseSchema } from '@/lib/validators/integrations'

const log = createLogger('IntegrationsService')

const TIMEOUT_MS = 10_000

export class IntegrationsServiceError extends Error {}

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
    throw new IntegrationsServiceError('Tensor-Core is unreachable. Is the backend running?')
  }
  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    throw new IntegrationsServiceError(detail ?? `Request failed (${response.status})`)
  }
  if (response.status === 204) return parse(null)
  return parse(await response.json())
}

function bearer(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

/** Every integration Tensor knows about, with what this brand has configured. */
export async function listIntegrations(token: string, brand: string): Promise<Integration[]> {
  return call(
    `/brands/${encodeURIComponent(brand)}/integrations`,
    { headers: bearer(token) },
    data => IntegrationsResponseSchema.parse(data).items,
  )
}

/**
 * Saves one provider's credentials.
 *
 * A secret left blank keeps whatever is stored — an admin editing the phone
 * number should not have to re-enter an API key they are not allowed to read.
 */
export async function saveIntegration(
  token: string,
  target: { brand: string; provider: string },
  values: Record<string, string>,
): Promise<Integration[]> {
  return call(
    `/brands/${encodeURIComponent(target.brand)}/integrations/${encodeURIComponent(target.provider)}`,
    { method: 'PUT', headers: bearer(token), body: JSON.stringify({ values }) },
    data => IntegrationsResponseSchema.parse(data).items,
  )
}

/** Forgets everything a provider was given. */
export async function disconnectIntegration(
  token: string,
  brand: string,
  provider: string,
): Promise<void> {
  await call(
    `/brands/${encodeURIComponent(brand)}/integrations/${encodeURIComponent(provider)}`,
    { method: 'DELETE', headers: bearer(token) },
    () => null,
  )
}
