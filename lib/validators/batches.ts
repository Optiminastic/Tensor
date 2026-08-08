import { z } from 'zod'

// Mirrors Tensor-Core's batchResponse (internal/httpapi/batches.go). A batch is
// a set of production jobs merged onto one printer bed - see
// lib/validators/production.ts for the job/order side of the pipeline.

export const BatchStatusSchema = z.enum(['pending_approval', 'open', 'in_progress', 'completed'])
export type BatchStatus = z.infer<typeof BatchStatusSchema>

export const BatchSchema = z.object({
  id: z.string(),
  batch_number: z.string(),
  machine_id: z.string().nullish(),
  status: z.string(),
  approved_by: z.string().nullish(),
  approved_at: z.string().nullish(),
  material_shortage: z.boolean(),
  merged_file_id: z.string().nullish(),
  preview_file_id: z.string().nullish(),
  units_per_bed: z.number().nullish(),
  total_print_time_minutes: z.number().nullish(),
  effective_time_per_unit_minutes: z.number().nullish(),
  total_filament_grams: z.number().nullish(),
  bed_utilization_percent: z.number().nullish(),
  packing_strategy: z.string().nullish(),
  created_at: z.string(),
  updated_at: z.string(),
  jobs_count: z.number().nullish(),
  // Derived from bed_utilization_percent against the nominal bed area -
  // present on every response, list and single-batch alike.
  occupied_area_mm2: z.number().nullish(),
  free_area_mm2: z.number().nullish(),
  // Only present on the single-batch GET (see attachPlateBbox in
  // internal/httpapi/batches.go) - the merged plate's overall combined size.
  plate_bbox_x_mm: z.number().nullish(),
  plate_bbox_y_mm: z.number().nullish(),
  plate_bbox_z_mm: z.number().nullish(),
})
export type Batch = z.infer<typeof BatchSchema>

// unbatchableResponse (production.Unbatchable) - a job the optimizer could not
// place in any batch, with why.
export const UnbatchableSchema = z.object({
  job_id: z.string(),
  job_number: z.string(),
  reason: z.string(),
})
export type Unbatchable = z.infer<typeof UnbatchableSchema>

export const AutoCreateBatchesResultSchema = z.object({
  created: BatchSchema.array(),
  unbatchable: UnbatchableSchema.array(),
})
export type AutoCreateBatchesResult = z.infer<typeof AutoCreateBatchesResultSchema>

// approveBatchRequest - machine_id is optional: the scheduler already assigns
// one at Draft creation, this only overrides it.
export const BatchApproveInputSchema = z.object({
  machine_id: z.string().min(1).optional(),
})
export type BatchApproveInput = z.infer<typeof BatchApproveInputSchema>

// patchBatchRequest.
export const BatchPatchInputSchema = z.object({
  status: BatchStatusSchema.optional(),
  machine_id: z.string().nullish(),
})
export type BatchPatchInput = z.infer<typeof BatchPatchInputSchema>
