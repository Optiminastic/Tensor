'use server'

import { headers } from 'next/headers'
import { z } from 'zod'

import { auth } from '@/lib/auth'
import { resolveBackendToken } from '@/lib/backend-token'
import { createLogger } from '@/lib/logger'
import { CostAssumptionInputSchema } from '@/lib/validators/config'
import {
  CostAssumptionsSchema,
  type DesignCPBreakdown,
  type DesignStatusResult,
  FixedVariableCostsSchema,
  MarginAssumptionsSchema,
  type SellingPriceResult,
  SlicerMetricsSchema,
} from '@/lib/validators/pricing'
import {
  ConfigServiceError,
  createDefaultCostAssumption,
  updateCostAssumption,
} from '@/services/config.service'
import {
  computeDesignCP,
  evaluateStatus,
  generateSellingPrice,
  PricingServiceError,
} from '@/services/pricing.service'

const log = createLogger('CostingActions')

export interface ActionResult<T = undefined> {
  ok: boolean
  error?: string
  data?: T
}

export interface CalculationResult {
  breakdown: DesignCPBreakdown
  selling: SellingPriceResult
  status: DesignStatusResult | null
}

const CalculateInputSchema = z.object({
  brand: z.string().min(1),
  metrics: SlicerMetricsSchema,
  assumptions: CostAssumptionsSchema.optional(),
  fixed_costs: FixedVariableCostsSchema.optional(),
  margins: MarginAssumptionsSchema.optional(),
})

function describe(error: unknown): string {
  if (error instanceof PricingServiceError) return error.message
  log.error({ err: error }, 'Unexpected error while pricing')
  return 'Something went wrong. Please try again.'
}

/**
 * Prices a design end to end: Design CP -> recommended selling price -> the
 * Green/Yellow/Red status at that price. The brand selects the pricing policy;
 * the engine is pure, so no data is written.
 */
export async function calculatePrice(input: unknown): Promise<ActionResult<CalculationResult>> {
  const parsed = CalculateInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Check the inputs and try again.',
    }
  }

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { ok: false, error: 'Your session has expired. Sign in again.' }

  const { brand, metrics, assumptions, fixed_costs, margins } = parsed.data
  try {
    const breakdown = await computeDesignCP({ metrics, assumptions })
    const selling = await generateSellingPrice({
      design_cp: breakdown.design_cp,
      brand,
      fixed_costs,
      margins,
    })
    let status: DesignStatusResult | null = null
    if (selling.recommended_sp !== null) {
      status = await evaluateStatus({
        design_cp: breakdown.design_cp,
        target_sp: selling.recommended_sp,
        brand,
        metrics,
      })
    }
    return { ok: true, data: { breakdown, selling, status } }
  } catch (error) {
    return { ok: false, error: describe(error) }
  }
}

/**
 * Saves the pricing cost assumptions (CP rates, fixed costs, margins). When id is
 * null - no default set exists yet - it creates one; otherwise it updates in
 * place. The token is re-resolved server-side; values are validated first. The
 * backend enforces config:manage, so this is a UI affordance, not the guard.
 */
export async function savePricingConfig(id: string | null, raw: unknown): Promise<ActionResult> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Sign in again.' }

  const parsed = CostAssumptionInputSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Some values are invalid.' }
  }

  try {
    if (id) {
      await updateCostAssumption(token, id, parsed.data)
    } else {
      await createDefaultCostAssumption(token, parsed.data)
    }
    return { ok: true }
  } catch (err) {
    if (err instanceof ConfigServiceError) return { ok: false, error: err.message }
    throw err
  }
}
