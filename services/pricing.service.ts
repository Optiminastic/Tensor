import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type CostAssumptions,
  type DesignCPBreakdown,
  DesignCPBreakdownSchema,
  type DesignStatusResult,
  DesignStatusResultSchema,
  type FixedVariableCosts,
  type MarginAssumptions,
  type SellingPriceResult,
  SellingPriceResultSchema,
  type SlicerMetrics,
} from '@/lib/validators/pricing'

const log = createLogger('PricingService')

const TIMEOUT_MS = 5_000

/**
 * Typed client for Tensor-Core's pure pricing engine (`/pricing/*`). These
 * endpoints are unauthenticated (no DB writes, no user data) and take inputs and
 * return numbers. Server-only.
 */

export class PricingServiceError extends Error {}

async function request<T>(path: string, body: unknown, parse: (data: unknown) => T): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ path, err: error }, 'Tensor-Core is unreachable')
    throw new PricingServiceError('Tensor-Core is unreachable. Is the backend running?')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((payload: { detail?: string }) => payload.detail)
      .catch(() => undefined)
    log.warn({ path, status: response.status, detail }, 'Tensor-Core rejected the request')
    throw new PricingServiceError(detail ?? `Request failed (${response.status})`)
  }

  return parse(await response.json())
}

export async function computeDesignCP(input: {
  metrics: SlicerMetrics
  assumptions?: CostAssumptions
}): Promise<DesignCPBreakdown> {
  return request('/pricing/design-cp', input, data => DesignCPBreakdownSchema.parse(data))
}

export interface SellingPriceInput {
  design_cp: number
  brand: string
  fixed_costs?: FixedVariableCosts
  margins?: MarginAssumptions
}

export async function generateSellingPrice(input: SellingPriceInput): Promise<SellingPriceResult> {
  return request('/pricing/selling-price', input, data => SellingPriceResultSchema.parse(data))
}

export interface StatusInput {
  design_cp: number
  target_sp: number
  brand: string
  metrics?: SlicerMetrics
}

export async function evaluateStatus(input: StatusInput): Promise<DesignStatusResult> {
  return request('/pricing/status', input, data => DesignStatusResultSchema.parse(data))
}
