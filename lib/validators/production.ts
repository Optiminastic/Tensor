import { z } from 'zod'

// Mirrors of Tensor-Core's production DTOs (snake_case). The frontend validates
// every response against these; the backend is the source of truth.

// productionJobResponse (internal/httpapi/production_jobs.go). Only the fields the
// UI uses are declared; unknown keys are stripped by Zod.
export const ProductionJobSchema = z.object({
  id: z.string(),
  job_number: z.string(),
  order_id: z.string().nullish(),
  batch_id: z.string().nullish(),
  description: z.string(),
  quantity: z.number(),
  status: z.string(),
  assembly_status: z.string(),
  finishing_status: z.string(),
  qc_status: z.string(),
  packaging_status: z.string(),
  personalisation_status: z.string(),
  priority: z.number(),
  held: z.boolean(),
  issue_reason: z.string().nullish(),
  due_date: z.string().nullish(),
  sku: z.string().nullish(),
  product_name: z.string().nullish(),
  material: z.string().nullish(),
  colour: z.string().nullish(),
  nozzle_profile: z.string().nullish(),
  filament_grams_required: z.number().nullish(),
  estimated_print_time_minutes: z.number().nullish(),
  print_file_id: z.string().nullish(),
  shopify_order_id: z.number().nullish(),
  shopify_customer_id: z.number().nullish(),
  customer_name: z.string().nullish(),
  personalisation_name: z.string().nullish(),
  personalisation_font: z.string().nullish(),
  personalisation_colour: z.string().nullish(),
  personalisation_variant: z.string().nullish(),
  personalisation_notes: z.string().nullish(),
  personalisation_photo_file_id: z.string().nullish(),
  personalisation_validated_by: z.string().nullish(),
  personalisation_validated_at: z.string().nullish(),
  personalisation_log: z.string().array().nullish(),
  name_confirmed: z.boolean(),
  photo_confirmed: z.boolean(),
  font_confirmed: z.boolean(),
  colour_confirmed: z.boolean(),
  variant_confirmed: z.boolean(),
  customer_approval_received: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type ProductionJob = z.infer<typeof ProductionJobSchema>

// patchProductionJobRequest (internal/httpapi/production_jobs.go#applyJobPatch).
// Every field the backend can PATCH - role-gated there via
// production.AllowedPatchFields, not re-validated here (see
// components/production/job-patch-fields.ts for the frontend's UX-only
// mirror of that gate). "failed" is deliberately absent from status: it can
// only be set via /fail, which records a reason and queues a reprint.
export const JobPatchInputSchema = z.object({
  status: z.enum(['queued', 'in_production', 'completed']).optional(),
  assembly_status: z.enum(['pending', 'completed', 'not_required']).optional(),
  finishing_status: z.enum(['pending', 'completed', 'not_required']).optional(),
  qc_status: z.enum(['pending', 'passed', 'failed']).optional(),
  packaging_status: z.enum(['pending', 'packaged']).optional(),
  priority: z.number().int().optional(),
  held: z.boolean().optional(),
  batch_id: z.string().nullish(),
})
export type JobPatchInput = z.infer<typeof JobPatchInputSchema>

// personalisationRequest (internal/httpapi/production_jobs.go#validatePersonalisation).
// POST /production-jobs/:id/personalisation overwrites every field wholesale, so the
// form must round-trip photo_file_id even when the UI does not let the operator
// change it directly.
export const PersonalisationValidateInputSchema = z.object({
  name_confirmed: z.boolean(),
  photo_confirmed: z.boolean(),
  font_confirmed: z.boolean(),
  colour_confirmed: z.boolean(),
  variant_confirmed: z.boolean(),
  customer_approval_received: z.boolean(),
  notes: z.string().max(2000).nullish(),
  photo_file_id: z.string().nullish(),
})
export type PersonalisationValidateInput = z.infer<typeof PersonalisationValidateInputSchema>

// assemblyRequest (internal/httpapi/production_qc.go#submitAssembly). POST
// /production-jobs/:id/assembly.
// failJobRequest (internal/httpapi/production_jobs.go#failProductionJob). The
// reason taxonomy is fixed by production.failureReasons - the backend 422s
// anything outside it, so the list is mirrored here to build the picker.
export const FAILURE_REASONS = [
  'bed_adhesion',
  'warping',
  'layer_shift',
  'filament_issue',
  'colour_issue',
  'support_failure',
  'power_issue',
  'machine_error',
  'wrong_personalisation',
  'design_issue',
  'operator_error',
  'other',
] as const

export const FailJobInputSchema = z.object({
  reason: z.enum(FAILURE_REASONS),
  notes: z.string().max(2000).nullish(),
  filament_wasted_grams: z.number().min(0).nullish(),
  time_wasted_minutes: z.number().int().min(0).nullish(),
})
export type FailJobInput = z.infer<typeof FailJobInputSchema>

// failJobResponse: the job just failed, plus the reprint the backend cloned
// from it at urgent priority.
export const FailJobResultSchema = z.object({
  failed_job: ProductionJobSchema,
  reprint_job: ProductionJobSchema,
})
export type FailJobResult = z.infer<typeof FailJobResultSchema>

// stationIssueRequest (internal/httpapi/production_issues.go). An issue is an
// event on the job's history, NOT a status: the job stays in its station queue,
// visible, and can still be completed afterwards. Deliberately a separate
// taxonomy from FAILURE_REASONS (why a print failed on the bed) and from
// issue_reason (pre-print catalogue validation).
export const STATION_ISSUE_REASONS = [
  'missing_part',
  'damaged_part',
  'poor_surface_finish',
  'wrong_colour',
  'wrong_personalisation',
  'dimension_out_of_spec',
  'cracked',
  'warped',
  'hardware_missing',
  'addon_faulty',
  'other',
] as const
export type StationIssueReason = (typeof STATION_ISSUE_REASONS)[number]

export const ISSUE_STAGES = ['assembly', 'finishing', 'qc'] as const
export type IssueStage = (typeof ISSUE_STAGES)[number]

export const StationIssueInputSchema = z.object({
  stage: z.enum(ISSUE_STAGES),
  reason: z.enum(STATION_ISSUE_REASONS),
  comment: z.string().max(1000).nullable(),
  // QC only: queue a reprint in the same transaction. quantity defaults to 1 -
  // one damaged part out of five is a reprint of one.
  request_reprint: z.boolean(),
  quantity: z.number().int().min(1).nullable(),
})
export type StationIssueInput = z.infer<typeof StationIssueInputSchema>

export const StationIssueResultSchema = z.object({
  job: ProductionJobSchema,
  reprint_job: ProductionJobSchema.nullish(),
})
export type StationIssueResult = z.infer<typeof StationIssueResultSchema>

// finishingRequest (internal/httpapi/production_qc.go#submitFinishing). The
// finishing station between assembly and QC - the backend rejects it until
// assembly is completed or skipped, and refuses QC until this one is resolved.
export const FinishingInputSchema = z.object({
  supports_removed: z.boolean(),
  sanded: z.boolean(),
  seams_cleaned: z.boolean(),
  surface_finish_ok: z.boolean(),
  photo_file_id: z.string().nullish(),
  notes: z.string().max(2000).nullish(),
})
export type FinishingInput = z.infer<typeof FinishingInputSchema>

export const AssemblyInputSchema = z.object({
  parts_combined: z.boolean(),
  hardware_attached: z.boolean(),
  addons_attached: z.boolean(),
  fit_check_ok: z.boolean(),
  photo_file_id: z.string().nullish(),
  notes: z.string().max(2000).nullish(),
})
export type AssemblyInput = z.infer<typeof AssemblyInputSchema>

// qcRequest (internal/httpapi/production_qc.go#submitQc). POST
// /production-jobs/:id/qc. A "fail" decision has the backend clone a reprint
// job at urgent priority, returned alongside the checked job.
export const QcInputSchema = z.object({
  correct_personalisation: z.boolean(),
  correct_colour: z.boolean(),
  surface_finish_ok: z.boolean(),
  no_cracks: z.boolean(),
  no_layer_defects: z.boolean(),
  dimensions_ok: z.boolean(),
  assembly_fit_ok: z.boolean(),
  addons_working: z.boolean(),
  packaging_safe: z.boolean(),
  photo_file_id: z.string().nullish(),
  decision: z.enum(['pass', 'fail']),
  notes: z.string().max(2000).nullish(),
})
export type QcInput = z.infer<typeof QcInputSchema>

export const QcSubmitResultSchema = z.object({
  job: ProductionJobSchema,
  reprint_job: ProductionJobSchema.nullish(),
})
export type QcSubmitResult = z.infer<typeof QcSubmitResultSchema>

// packagingRequest (internal/httpapi/production_qc.go#submitPackaging). POST
// /production-jobs/:id/packaging. Requires qc_status = 'passed' on the backend.
export const PackagingInputSchema = z.object({
  packaging_type: z.string().min(1, 'Packaging type is required').max(128),
  addons: z.string().max(2000).nullish(),
  gift_message: z.string().max(2000).nullish(),
  fragile: z.boolean(),
  courier_partner: z.string().max(255).nullish(),
  invoice_reference: z.string().max(255).nullish(),
  photo_file_id: z.string().nullish(),
})
export type PackagingInput = z.infer<typeof PackagingInputSchema>

// orderResponse (internal/httpapi/orders.go). source is "shopify_webhook" for a
// real imported order or "seed" for a dummy one - what the live/dummy toggle
// filters the /orders?source= request on. "shopify_webhook" is a stored legacy
// label: orders are now only ever pulled by an explicit sync, never pushed.
export const OrderSchema = z.object({
  id: z.string(),
  shopify_order_id: z.number(),
  order_number: z.string(),
  customer_name: z.string().nullish(),
  shopify_customer_id: z.number().nullish(),
  customer_email: z.string().nullish(),
  customer_phone: z.string().nullish(),
  financial_status: z.string(),
  total_price: z.number(),
  currency: z.string(),
  status: z.string(),
  source: z.string(),
  imported_at: z.string(),
  // Set only when the backend's job-creation worker exhausted its retries on
  // this order: it has no production jobs and never will without a manual
  // retry. Null on a healthy order.
  job_creation_error: z.string().nullish(),
  job_creation_failed_at: z.string().nullish(),
})
export type Order = z.infer<typeof OrderSchema>

// orderDetailResponse adds the raw Shopify line items (only the fields the UI
// reads are declared, the rest are ignored) plus products - the typed,
// commerce-facing per-item rows from order_line_items (SKU, name, image).
export const OrderLineItemSchema = z.object({
  title: z.string().nullish(),
  name: z.string().nullish(),
  quantity: z.number().nullish(),
})
export const OrderProductSchema = z.object({
  id: z.string(),
  shopify_order_id: z.number(),
  shopify_customer_id: z.number().nullish(),
  sku: z.string().nullish(),
  product_name: z.string(),
  product_image_url: z.string().nullish(),
  quantity: z.number(),
})
export type OrderProduct = z.infer<typeof OrderProductSchema>

export const OrderDetailSchema = OrderSchema.extend({
  line_items: OrderLineItemSchema.array().nullish(),
  products: OrderProductSchema.array().nullish(),
})
export type OrderDetail = z.infer<typeof OrderDetailSchema>

// filamentResponse (internal/httpapi/filament.go). Inventory is an aggregate
// grams-per-(material, colour), with a reorder threshold - not per-spool.
export const FilamentSchema = z.object({
  id: z.string(),
  material: z.string(),
  colour: z.string().nullish(),
  grams_available: z.number(),
  reorder_level_grams: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type Filament = z.infer<typeof FilamentSchema>

// filamentUpsertRequest - keyed on (material, colour); POST upserts.
export const FilamentInputSchema = z.object({
  material: z.string().min(1, 'Material is required').max(255),
  colour: z.string().max(255).optional(),
  grams_available: z.number().min(0, 'Must be zero or more'),
  reorder_level_grams: z.number().min(0, 'Must be zero or more'),
})
export type FilamentInput = z.infer<typeof FilamentInputSchema>

/**
 * What mirroring BambuBuddy's spool shelf into Tensor's inventory changed.
 *
 * `spools` counts individual spools as BambuBuddy shows them; `created` and
 * `updated` count material/colour buckets, which is how Tensor stores stock.
 * Reporting both is what lets an operator reconcile the two views at a glance.
 */
export const FilamentSyncResultSchema = z.object({
  spools: z.number(),
  created: z.number(),
  updated: z.number(),
  total_grams: z.number(),
})

export type FilamentSyncResult = z.infer<typeof FilamentSyncResultSchema>
