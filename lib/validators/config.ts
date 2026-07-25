import { z } from 'zod'

// Mirrors Tensor-Core's cost assumption set. Percentages are fractions (0.30 =
// 30%). fixed_costs and margins are the inputs the selling price is built from -
// making them editable here is what stops the price being hardcoded.

export const FixedCostsSchema = z.object({
  packaging: z.number(),
  shipping: z.number(),
  rto_cod: z.number(),
  payment_gateway: z.number(),
  tech_allocation: z.number(),
  other: z.number(),
})
export type FixedCosts = z.infer<typeof FixedCostsSchema>

export const MarginsSchema = z.object({
  ad_spend_pct: z.number(),
  team_pct: z.number(),
  overhead_pct: z.number(),
  target_profit_pct: z.number(),
})
export type Margins = z.infer<typeof MarginsSchema>

export const CostAssumptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string().nullable(),
  filament_cost_per_kg: z.number(),
  electricity_cost_per_unit: z.number(),
  machine_hour_cost: z.number(),
  finishing_labour: z.number(),
  consumables: z.number(),
  failure_pct: z.number(),
  fixed_costs: FixedCostsSchema,
  margins: MarginsSchema,
  is_default: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type CostAssumption = z.infer<typeof CostAssumptionSchema>

// The editable form values. The four margin shares must sum to under 1, or the
// selling price has no room for cost (the backend enforces this too).
export const CostAssumptionInputSchema = z
  .object({
    filament_cost_per_kg: z.number().positive(),
    electricity_cost_per_unit: z.number().min(0),
    machine_hour_cost: z.number().min(0),
    finishing_labour: z.number().min(0),
    consumables: z.number().min(0),
    failure_pct: z.number().min(0).max(1),
    fixed_costs: FixedCostsSchema,
    margins: MarginsSchema,
  })
  .refine(
    v =>
      v.margins.ad_spend_pct +
        v.margins.team_pct +
        v.margins.overhead_pct +
        v.margins.target_profit_pct <
      1,
    {
      message: 'Ad spend, team, overhead and target profit must sum to under 100%.',
      path: ['margins'],
    },
  )
export type CostAssumptionInput = z.infer<typeof CostAssumptionInputSchema>
