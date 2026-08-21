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
  // Null while the batch's time is batchTimeFromJobs' estimate rather than a
  // slice of this actual bed. Also gates "Send to printer": no plate slice
  // means no .gcode.3mf exists to send.
  plate_sliced_at: z.string().nullish(),
  plate_slice_error: z.string().nullish(),
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

// addJobsToBatchRequest - only unassigned jobs matching the batch's material/
// nozzle/machine-family configuration are accepted (see
// GET /batches/:id/compatible-jobs), and only while the batch is still Draft.
export const AddJobsToBatchInputSchema = z.object({
  job_ids: z.string().min(1).array().min(1),
})
export type AddJobsToBatchInput = z.infer<typeof AddJobsToBatchInputSchema>

/**
 * What sending a locked batch to BambuBuddy reported back.
 *
 * `queued: false` is not necessarily a failure - the plate can reach
 * BambuBuddy's library and still not be queued (already sent, or the queue
 * declined it), which is why `note` carries BambuBuddy's own wording rather
 * than the UI inventing a reason.
 */
export const PrintBatchResultSchema = z.object({
  filename: z.string(),
  file_id: z.number(),
  queued: z.boolean(),
  already_sent: z.boolean(),
  note: z.string(),
})

export type PrintBatchResult = z.infer<typeof PrintBatchResultSchema>
