import { z } from 'zod'

import { FlowSchema, NozzleSchema } from '@/lib/validators/machines'

// The slice answers. Materials/qualities must match what the backend accepts
// (internal/httpapi/designs.go validMaterials/validQualities -> the H2S slicer
// profiles in internal/slicing/profiles.go). The backend re-validates these.
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

// The design form's dual-nozzle slicing config - resolved server-side to a
// machine_profiles row (design_machine_link.go) rather than requiring the
// designer to pick one from a separate machine picker.
export const DesignMachineSpecSchema = z.object({
  left_nozzle_mm: NozzleSchema,
  right_nozzle_mm: NozzleSchema,
  left_flow: FlowSchema,
  right_flow: FlowSchema,
})
export type DesignMachineSpec = z.infer<typeof DesignMachineSpecSchema>

// Bambu sparse-infill patterns we expose (a curated subset of the slicer's set).
export const InfillPatternSchema = z.enum([
  'grid',
  'gyroid',
  'honeycomb',
  'cubic',
  'triangles',
  'line',
  'concentric',
  'tri-hexagon',
  'lightning',
])
export type InfillPattern = z.infer<typeof InfillPatternSchema>

// Advanced slice overrides, mirroring the backend allowlist. Every field is
// optional; these bounds are UX only - Tensor-Core re-clamps and re-allowlists
// server-side before anything reaches the slicer CLI.
export const SliceSettingsSchema = z.object({
  layer_height_mm: z.number().min(0.08).max(0.28).optional(),
  wall_loops: z.number().int().min(1).max(8).optional(),
  infill_pattern: InfillPatternSchema.optional(),
  support: z.boolean().optional(),
  support_threshold_deg: z.number().int().min(0).max(90).optional(),
})
export type SliceSettings = z.infer<typeof SliceSettingsSchema>

// The re-slice request body: the spec answers plus optional advanced overrides
// and an optional machine to slice on, sent flat (the backend's resubmit endpoint
// reads them all).
export const ResubmitInputSchema = DesignSpecsSchema.extend(SliceSettingsSchema.shape).extend({
  machine_id: z.string().uuid().optional(),
  filament_preset: z.string().optional(),
})
export type ResubmitInput = z.infer<typeof ResubmitInputSchema>

// The SKU assign form. Empty string clears the SKU; a non-empty value must match
// the backend's accepted shape (letters, digits, and - . _ / , up to 64 chars).
// The backend re-validates and owns uniqueness, so this is UX, not the constraint.
export const DesignSkuInputSchema = z.object({
  sku: z
    .string()
    .trim()
    .max(64, 'A SKU is at most 64 characters.')
    .refine(v => v === '' || /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(v), {
      message: 'Use letters, digits and - . _ / (start with a letter or digit).',
    }),
})
export type DesignSkuInput = z.infer<typeof DesignSkuInputSchema>

// What personalization a product offers. Mirrors the backend jsonb rule set;
// every field is defaulted so a partial/absent blob still parses.
const PersonalisationEnumRuleSchema = z.object({
  required: z.boolean().default(false),
  allowed: z.string().array().default([]),
})
export const PersonalisationRulesSchema = z.object({
  enabled: z.boolean().default(false),
  name: z
    .object({
      required: z.boolean().default(false),
      min_length: z.number().int().default(0),
      max_length: z.number().int().default(0),
    })
    .default({}),
  font: PersonalisationEnumRuleSchema.default({}),
  colour: PersonalisationEnumRuleSchema.default({}),
  variant: PersonalisationEnumRuleSchema.default({}),
  photo: z.object({ required: z.boolean().default(false) }).default({}),
  approval: z.object({ required: z.boolean().default(false) }).default({}),
  zone: z.object({ width_mm: z.number(), height_mm: z.number() }).nullish(),
})
export type PersonalisationRules = z.infer<typeof PersonalisationRulesSchema>

// The fast pre-slice estimate returned by /designs/:id/personalisation-estimate.
export const PersonalisationEstimateSchema = z.object({
  source: z.string(),
  added_grams: z.number(),
  added_time_minutes: z.number(),
  base_design_cp: z.number(),
  estimated_design_cp: z.number(),
  added_design_cp: z.number(),
})
export type PersonalisationEstimate = z.infer<typeof PersonalisationEstimateSchema>

// The AI optimization advisor's report returned by POST /designs/:id/optimize:
// an overall verdict plus nozzle-aware filament, support, and ranked improvements.
export const OptimizationRecommendationSchema = z.object({
  title: z.string(),
  detail: z.string(),
  category: z.string(),
  impact: z.string(),
})
export const DesignOptimizationSchema = z.object({
  verdict: z.enum(['green', 'yellow', 'red']),
  summary: z.string(),
  filament: z.object({
    material: z.string(),
    recommended_preset: z.string(),
    rationale: z.string(),
  }),
  support: z.object({
    needed: z.boolean(),
    strategy: z.string(),
    material: z.string(),
    rationale: z.string(),
  }),
  recommendations: OptimizationRecommendationSchema.array(),
})
export type DesignOptimization = z.infer<typeof DesignOptimizationSchema>

export const DesignLifecycleSchema = z.enum([
  'queued',
  'slicing',
  'priced',
  'failed',
  'submitted',
  'changes_requested',
  'approved',
  'published',
])
export type DesignLifecycle = z.infer<typeof DesignLifecycleSchema>

export const VerdictSchema = z.enum(['green', 'yellow', 'red'])
export type Verdict = z.infer<typeof VerdictSchema>

// One entry on a design's review thread: a lifecycle event or a freeform comment.
export const ReviewKindSchema = z.enum(['comment', 'submit', 'approve', 'reject'])
export type ReviewKind = z.infer<typeof ReviewKindSchema>

export const DesignReviewSchema = z.object({
  id: z.string(),
  author_id: z.string(),
  kind: ReviewKindSchema,
  body: z.string().nullable(),
  created_at: z.string(),
})
export type DesignReview = z.infer<typeof DesignReviewSchema>

// A review event enriched with its author's display identity, resolved on the
// server from Better Auth's user table. author_name/email are null when the
// author id no longer resolves to a user.
export interface DesignTimelineEntry extends DesignReview {
  author_name: string | null
  author_email: string | null
}

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
  // The catalog SKU. nullish so a backend that predates the field, and a design
  // that has not been assigned one yet, both parse cleanly.
  sku: z.string().nullish(),
  // Whether a cover image was uploaded. Defaulted so a backend that predates the
  // preview field doesn't break the list.
  has_preview: z.boolean().optional().default(false),
  created_at: z.string(),
  updated_at: z.string(),
})
export type Design = z.infer<typeof DesignSchema>

// The least-support resting orientation computed from the model mesh. Advisory:
// it never changes the costed price. est_reduction_pct is a fraction (0..1).
export const OrientationSchema = z.object({
  rotation_axis: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  rotation_degrees: z.number(),
  overhang_area_baseline: z.number(),
  overhang_area_recommended: z.number(),
  est_reduction_pct: z.number(),
  description: z.string(),
  already_optimal: z.boolean(),
})
export type Orientation = z.infer<typeof OrientationSchema>

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
  orientation: OrientationSchema.nullable(),
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
  raw_sp: z.number(),
  cp_pct_at_recommended: z.number().nullable(),
  passes_normal: z.boolean(),
  survives_stress: z.boolean(),
  sp_warnings: z.string().array(),
  approved_sp: z.number().nullable(),
  reasons: z.string().array(),
  suggestions: z.string().array(),
})
export type DesignPricing = z.infer<typeof DesignPricingSchema>

export const ShopifyProductSchema = z.object({
  status: z.string(),
  handle: z.string(),
  admin_url: z.string(),
})
export type ShopifyProduct = z.infer<typeof ShopifyProductSchema>

export const SliceJobSchema = z.object({
  status: z.string(),
  attempt: z.number(),
  error: z.string().nullable(),
})
export type SliceJob = z.infer<typeof SliceJobSchema>

// The design's linked slicing config (designMachineResponse, mirroring the
// same shape machines.ts's Machine uses for nozzle/flow) - the "Machine" tab.
export const DesignMachineSchema = z.object({
  id: z.string(),
  family: z.string(),
  nozzle_mm: z.number(),
  // default(null): a single-nozzle backend (or one out of step with this repo)
  // omits the right-side keys entirely; treat a missing value as "no right side"
  // so the Machine tab renders "-" instead of crashing on parse.
  right_nozzle_mm: z.number().nullable().default(null),
  flow: z.string(),
  right_flow: z.string().nullable().default(null),
})
export type DesignMachine = z.infer<typeof DesignMachineSchema>

// Upload metadata captured on the design (spec Step 1).
export const DesignAttributesSchema = z.object({
  product_type: z.string().optional(),
  personalisation_type: z.string().optional(),
  colour_count: z.number().int().optional(),
  add_ons: z.string().array().optional(),
  packaging_type: z.string().optional(),
})
export type DesignAttributes = z.infer<typeof DesignAttributesSchema>

// Advisory print-reliability signal derived from the slice metrics (spec section 2).
export const FailureRiskSchema = z.object({
  score: z.number(),
  band: z.enum(['low', 'medium', 'high']),
  factors: z.string().array(),
})
export type FailureRisk = z.infer<typeof FailureRiskSchema>

export const DesignDetailSchema = DesignSchema.extend({
  // nullish (not just nullable): tolerate a backend that predates the notes field,
  // so the detail page never crashes if the two repos are briefly out of step.
  notes: z.string().nullish(),
  job: SliceJobSchema.nullable(),
  metrics: DesignMetricsSchema.nullable(),
  pricing: DesignPricingSchema.nullable(),
  shopify: ShopifyProductSchema.nullable(),
  // nullish for the same reason as notes - a design predating this field, or
  // one whose machine_id link couldn't be resolved, both render an empty tab
  // rather than crashing.
  machine: DesignMachineSchema.nullish(),
  // What personalization this product offers. null = not personalizable.
  personalisation_rules: PersonalisationRulesSchema.nullish(),
  attributes: DesignAttributesSchema.nullish(),
  failure_risk: FailureRiskSchema.nullish(),
})
export type DesignDetail = z.infer<typeof DesignDetailSchema>

// The "few details" a Project Lead confirms when approving + publishing. Price
// defaults to the recommended SP; the rest is completed in Shopify.
export const PublishInputSchema = z.object({
  title: z.string().min(1, 'Give the product a title').max(255),
  price: z.number().int().positive(),
  product_type: z.string().max(255).optional(),
  tags: z.string().array().optional(),
  vendor: z.string().max(255).optional(),
  description: z.string().max(50_000).optional(),
  seo_title: z.string().max(255).optional(),
  seo_description: z.string().max(320).optional(),
  sku: z.string().max(255).optional(),
  weight_grams: z.number().min(0).max(1_000_000).optional(),
})
export type PublishInput = z.infer<typeof PublishInputSchema>

export const PublishResultSchema = z.object({
  status: z.string(),
  admin_url: z.string(),
  handle: z.string(),
  product_gid: z.string(),
})
export type PublishResult = z.infer<typeof PublishResultSchema>
