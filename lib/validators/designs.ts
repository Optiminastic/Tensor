import { z } from 'zod'

// The slice answers. Materials/qualities must match a worker H2S profile; the
// backend re-validates these, so the frontend list is UX, not the constraint.
export const MaterialSchema = z.enum(['PLA', 'PETG', 'ABS'])
export const QualitySchema = z.enum(['draft', 'standard', 'fine'])
export const FinishSchema = z.enum(['none', 'sanded', 'painted'])

export const DesignSpecsSchema = z.object({
  material: MaterialSchema,
  colour: z.string().max(60).optional(),
  finish: FinishSchema,
  units_per_bed: z.number().int().min(1).max(100),
  quality: QualitySchema,
  infill_pct: z.number().min(0).max(100),
})
export type DesignSpecs = z.infer<typeof DesignSpecsSchema>

export const DesignLifecycleSchema = z.enum(['queued', 'slicing', 'priced', 'failed'])
export type DesignLifecycle = z.infer<typeof DesignLifecycleSchema>

export const VerdictSchema = z.enum(['green', 'yellow', 'red'])
export type Verdict = z.infer<typeof VerdictSchema>

export const DesignSchema = z.object({
  id: z.string(),
  brand_slug: z.string(),
  name: z.string(),
  created_by: z.string(),
  status: DesignLifecycleSchema,
  material: z.string(),
  colour: z.string().nullable(),
  finish: z.string(),
  units_per_bed: z.number(),
  quality: z.string(),
  infill_pct: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type Design = z.infer<typeof DesignSchema>

export const DesignMetricsSchema = z.object({
  print_time_hr: z.number(),
  effective_machine_time_hr: z.number(),
  filament_g: z.number(),
  purge_g: z.number(),
  support_g: z.number(),
  colour_changes: z.number(),
  electricity_kwh: z.number(),
  units_per_bed: z.number(),
  layer_height_mm: z.number(),
  infill_density_pct: z.number(),
  wall_loops: z.number(),
  support_used: z.boolean(),
  filament_length_mm: z.number(),
  gcode_key: z.string(),
})
export type DesignMetrics = z.infer<typeof DesignMetricsSchema>

export const CPBreakdownSchema = z.object({
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
export type CPBreakdown = z.infer<typeof CPBreakdownSchema>

export const DesignPricingSchema = z.object({
  design_cp: z.number(),
  breakdown: CPBreakdownSchema,
  verdict: VerdictSchema,
  cp_pct: z.number(),
  recommended_sp: z.number().nullable(),
  reasons: z.string().array(),
  suggestions: z.string().array(),
})
export type DesignPricing = z.infer<typeof DesignPricingSchema>

export const SliceJobSchema = z.object({
  status: z.string(),
  attempt: z.number(),
  error: z.string().nullable(),
})
export type SliceJob = z.infer<typeof SliceJobSchema>

export const DesignDetailSchema = DesignSchema.extend({
  job: SliceJobSchema.nullable(),
  metrics: DesignMetricsSchema.nullable(),
  pricing: DesignPricingSchema.nullable(),
})
export type DesignDetail = z.infer<typeof DesignDetailSchema>
