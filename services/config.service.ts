// Server-only by placement (called from server actions and server components).
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type CostAssumption,
  type CostAssumptionInput,
  CostAssumptionSchema,
} from '@/lib/validators/config'

const log = createLogger('ConfigService')
const TIMEOUT_MS = 15_000

/**
 * Typed client for Tensor-Core's /config endpoints. Server-only. Every call
 * carries the caller's bearer token; the backend enforces config:* against it.
 */
export class ConfigServiceError extends Error {}

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
    throw new ConfigServiceError('Tensor-Core is unreachable. Is the backend running?')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ path, status: response.status, detail }, 'Tensor-Core rejected the config request')
    throw new ConfigServiceError(detail ?? `Request failed (${response.status})`)
  }

  if (response.status === 204) return parse(undefined)
  return parse(await response.json())
}

function jsonHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
}

/** The cost assumption set the pricing path uses: the default set, if any. */
export async function getDefaultCostAssumption(token: string): Promise<CostAssumption | null> {
  const sets = await call('/config/cost-assumptions', { headers: jsonHeaders(token) }, data =>
    CostAssumptionSchema.array().parse(data),
  )
  return sets.find(s => s.is_default) ?? sets[0] ?? null
}

export async function updateCostAssumption(
  token: string,
  id: string,
  input: CostAssumptionInput,
): Promise<CostAssumption> {
  return call(
    `/config/cost-assumptions/${encodeURIComponent(id)}`,
    { method: 'PATCH', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => CostAssumptionSchema.parse(data),
  )
}

// createDefaultCostAssumption seeds a default set from the form when none exists
// yet, so the editor works on a fresh install without a CLI seed.
export async function createDefaultCostAssumption(
  token: string,
  input: CostAssumptionInput,
): Promise<CostAssumption> {
  return call(
    '/config/cost-assumptions',
    {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify({ name: 'Default cost assumptions', is_default: true, ...input }),
    },
    data => CostAssumptionSchema.parse(data),
  )
}
