import { z } from 'zod'

// Shapes mirror Tensor-Core's pricing engine (internal/pricing/models.go). The
// backend applies defaults for every omitted optional field, so requests only
// need the required slicer metrics.

// --- Request inputs ----------------------------------------------------------

export const SlicerMetricsSchema = z.object({
  print_time_hr: z.number().positive(),
  filament_g: z.number().min(0),
  effective_machine_time_hr: z.number().positive(),
  purge_g: z.number().min(0).optional(),
  support_g: z.number().min(0).optional(),
  colour_changes: z.number().int().min(0).optional(),
  electricity_kwh: z.number().min(0).optional(),
  units_per_bed: z.number().int().min(1).optional(),
  failure_risk: z.number().min(0).max(1).optional(),
})

export const CostAssumptionsSchema = z.object({
  filament_cost_per_kg: z.number().min(0).optional(),
  electricity_cost_per_unit: z.number().min(0).optional(),
  machine_hour_cost: z.number().min(0).optional(),
  finishing_labour: z.number().min(0).optional(),
  consumables: z.number().min(0).optional(),
  failure_pct: z.number().min(0).max(1).optional(),
})

export const FixedVariableCostsSchema = z.object({
  packaging: z.number().min(0).optional(),
  shipping: z.number().min(0).optional(),
  rto_cod: z.number().min(0).optional(),
  payment_gateway: z.number().min(0).optional(),
  tech_allocation: z.number().min(0).optional(),
  other: z.number().min(0).optional(),
})

export const MarginAssumptionsSchema = z.object({
  ad_spend_pct: z.number().min(0).max(1).optional(),
  team_pct: z.number().min(0).max(1).optional(),
  overhead_pct: z.number().min(0).max(1).optional(),
  target_profit_pct: z.number().min(0).max(1).optional(),
})

// --- Responses ---------------------------------------------------------------

export const DesignCPBreakdownSchema = z.object({
  filament: z.number(),
  purge: z.number(),
  electricity: z.number(),
  machine: z.number(),
  finishing: z.number(),
  consumables: z.number(),
  failure_provision: z.number(),
  subtotal: z.number(),
  design_cp: z.number(),
})

export const SellingPriceResultSchema = z.object({
  raw_sp: z.number(),
  recommended_sp: z.number().int().nullable(),
  cp_pct_at_recommended: z.number().nullable(),
  passes_normal: z.boolean(),
  survives_stress: z.boolean(),
  warnings: z.array(z.string()),
})

export const DesignStatusResultSchema = z.object({
  status: z.enum(['green', 'yellow', 'red']),
  cp_pct: z.number(),
  reasons: z.array(z.string()),
})

export type SlicerMetrics = z.infer<typeof SlicerMetricsSchema>
export type CostAssumptions = z.infer<typeof CostAssumptionsSchema>
export type FixedVariableCosts = z.infer<typeof FixedVariableCostsSchema>
export type MarginAssumptions = z.infer<typeof MarginAssumptionsSchema>
export type DesignCPBreakdown = z.infer<typeof DesignCPBreakdownSchema>
export type SellingPriceResult = z.infer<typeof SellingPriceResultSchema>
export type DesignStatusResult = z.infer<typeof DesignStatusResultSchema>
