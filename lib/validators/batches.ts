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
  // Why the batch never reached the printer, in BambuBuddy's own words.
  // Distinct from plate_slice_error: that one means there is no print file,
  // this one means there is a file nothing will pick up.
  print_error: z.string().nullish(),
  // BambuBuddy's queue item, present once the plate was accepted.
  queue_item_id: z.number().nullish(),
  created_at: z.string(),
  updated_at: z.string(),
  jobs_count: z.number().nullish(),
  // Which Shopify orders are on this bed, ascending and deduplicated. The
  // Batches table shows these instead of a job count - standing at a printer,
  // the question is whose work is on the plate, not how many rows it holds.
  order_numbers: z.string().array().nullish(),
  has_priority: z.boolean().nullish(),
  priority_order_numbers: z.string().array().nullish(),
  // The distinct filament colours on this bed, with the swatch to draw each.
  // hex is empty when the colour is not on the filament shelf - the name still
  // shows, so a colour nobody has registered is visible rather than hidden.
  colours: z.object({ name: z.string(), hex: z.string() }).array().nullish(),
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
/**
 * What signing off some of a bed's planks did.
 *
 * `remaining` is the number still outstanding, and zero is what turns the bed
 * Done - which is why the dialog can say "3 marked done, 1 left" without asking
 * the server a second time.
 */
export const CompleteBatchJobsResultSchema = z.object({
  batch: BatchSchema,
  completed: z.number(),
  remaining: z.number(),
})
export type CompleteBatchJobsResult = z.infer<typeof CompleteBatchJobsResultSchema>

export const AddJobsToBatchInputSchema = z.object({
  job_ids: z.string().min(1).array().min(1),
})
export type AddJobsToBatchInput = z.infer<typeof AddJobsToBatchInputSchema>

/**
 * What deleting a bed freed.
 *
 * `jobs_released` is the point: the jobs are not deleted with the bed, they go
 * back to the pool to be re-planned, and telling the operator how many went back
 * is the difference between "a row disappeared" and "that work is still coming".
 */
export const BatchDeleteResultSchema = z.object({
  batch_number: z.string(),
  jobs_released: z.number(),
  note: z.string(),
})
export type BatchDeleteResult = z.infer<typeof BatchDeleteResultSchema>

/** One job the rebuild check spoke about, and why. */
const RebuiltJobSchema = z.object({
  job_number: z.string(),
  reason: z.string(),
})

/**
 * What checking a bed's models against its orders found.
 *
 * `correct` names the jobs rather than counting them: an operator deciding
 * whether to trust a bed needs to see that the others were checked, not only
 * that one was wrong. `skipped` is the jobs the check cannot speak for - an
 * uploaded design has no template to compare against.
 */
export const BatchRebuildResultSchema = z.object({
  batch_number: z.string(),
  checked: z.number(),
  // nullish, not just default: `default` fills in for undefined only, and Go
  // marshals an empty slice as null - so a check that found nothing to rebuild
  // (the happy answer) failed to parse and read on screen as "could not check
  // this batch's models". The API sends [] now; this stays tolerant of both.
  queued: RebuiltJobSchema.array()
    .nullish()
    .transform(jobs => jobs ?? []),
  correct: z
    .string()
    .array()
    .nullish()
    .transform(names => names ?? []),
  skipped: RebuiltJobSchema.array()
    .nullish()
    .transform(jobs => jobs ?? []),
  note: z.string(),
})
export type BatchRebuildResult = z.infer<typeof BatchRebuildResultSchema>

/**
 * What reprinting part of a finished bed produced.
 *
 * Each pair is the plank that was scrapped and the job that replaces it, so the
 * operator can follow which became which; `batch` is the new locked bed holding
 * them, ready to send.
 */
/**
 * Which planks to reprint off a finished bed, and why.
 *
 * One reason for the selection, not one per job: they came off a single plate
 * in a single state, and a per-plank reason is a form nobody fills in honestly.
 */
export const BatchReprintInputSchema = z.object({
  job_ids: z.string().min(1).array().min(1),
  reason: z.string().min(1),
  notes: z.string().max(2000).nullish(),
  filament_wasted_grams: z.number().min(0).nullish(),
  time_wasted_minutes: z.number().int().min(0).nullish(),
})
export type BatchReprintInput = z.infer<typeof BatchReprintInputSchema>

export const BatchReprintResultSchema = z.object({
  batch: BatchSchema,
  // nullish for the same reason as the rebuild result above: an empty Go slice
  // arrives as null, and one schema tolerating it beside another that does not
  // is how this bites again later.
  reprinted: z
    .object({ failed_job_number: z.string(), reprint_job_number: z.string() })
    .array()
    .nullish()
    .transform(pairs => pairs ?? []),
  note: z.string(),
})
export type BatchReprintResult = z.infer<typeof BatchReprintResultSchema>

/**
 * A colour the bed needs, and the swatch to draw it.
 *
 * `hex` is empty when the colour is not on the filament shelf. The name still
 * shows: a colour nobody has registered is a thing to fix, not a thing to hide.
 */
const QueueColourSchema = z.object({ name: z.string(), hex: z.string() })

/**
 * One filament slot the plate asks for, in the plate's own order.
 *
 * Slot 1 is the plank body Tensor adds itself; the rest are the lettering
 * colours an order asked for. This is the authoritative list of what the bed
 * needs - the `colours` array is job-derived and omits the body entirely.
 */
const QueueSlotSchema = z.object({
  index: z.number(),
  hex: z.string(),
  name: z.string().nullish(),
  material: z.string().nullish(),
})
export type QueueSlot = z.infer<typeof QueueSlotSchema>

/**
 * One AMS slot: what is in it, and where it physically is.
 *
 * The position is what lets the dialog say "AMS 1, slot 2" instead of showing a
 * colour with no way to find it, and it is what a filament mapping is built
 * from when the plate is sent. Both ids are nullable: a machine synced before
 * Tensor recorded them has neither, and slot 0 is a real slot, so absent must
 * stay distinguishable from zero.
 */
const QueueTraySchema = z.object({
  hex: z.string(),
  type: z.string(),
  ams_id: z.number().nullish(),
  tray_id: z.number().nullish(),
  remaining_grams: z.number().nullish(),
})
export type QueueTray = z.infer<typeof QueueTraySchema>

/**
 * One printer, and whether it can take this bed.
 *
 * Ineligible machines are listed too, with `missing` naming the colours they do
 * not hold. A printer an operator can see standing idle, absent from the list
 * with no explanation, is the kind of thing that gets worked around rather than
 * fixed.
 */
const QueueMachineSchema = z.object({
  id: z.string(),
  name: z.string(),
  model: z.string(),
  status: z.string(),
  // Empty Go slices marshal as null - the same trap the rebuild result hit.
  loaded: z
    .string()
    .array()
    .nullish()
    .transform(v => v ?? []),
  trays: QueueTraySchema.array()
    .nullish()
    .transform(v => v ?? []),
  // The spool to use for each plate slot, in slot order, as ams_mapping
  // integers. A default from nearest colour - the operator sees it beside both
  // swatches and can change any of it.
  suggested_slot_trays: z
    .number()
    .array()
    .nullish()
    .transform(v => v ?? []),
  missing: z
    .string()
    .array()
    .nullish()
    .transform(v => v ?? []),
  eligible: z.boolean(),
  // The printer the backend would pick: the closest colour match, idle before
  // busy. A suggestion the operator can override, not a decision.
  suggested: z
    .boolean()
    .nullish()
    .transform(v => v ?? false),
  reason: z.string().nullish(),
})
export type QueueMachine = z.infer<typeof QueueMachineSchema>

/** What the Queue dialog draws: the bed's colours, and who can print them. */
export const BatchQueueOptionsSchema = z.object({
  batch_number: z.string(),
  status: z.string(),
  colours: QueueColourSchema.array()
    .nullish()
    .transform(v => v ?? []),
  machines: QueueMachineSchema.array()
    .nullish()
    .transform(v => v ?? []),
  slots: QueueSlotSchema.array()
    .nullish()
    .transform(v => v ?? []),
  note: z.string(),
})
export type BatchQueueOptions = z.infer<typeof BatchQueueOptionsSchema>

/** Which machine to send the bed to. */
export const BatchQueueInputSchema = z.object({
  machine_id: z.string().min(1),
  // Which spool prints each plate slot, in slot order. The operator picks these
  // looking at the bed's swatches and the printer's trays side by side; Tensor
  // deliberately does not infer them, because an AMS reports a colour as a bare
  // hex and a guess here prints a plank in the wrong colour.
  slot_trays: z.number().array(),
})
export type BatchQueueInput = z.infer<typeof BatchQueueInputSchema>

/**
 * What queueing to a chosen machine did.
 *
 * `pinned` is the honest part: the plate can reach BambuBuddy's queue and still
 * not be tied to the printer that was picked, because the queue entry does not
 * exist until slicing finishes. It prints either way - possibly on another
 * machine of the same model - and the note says which happened.
 */
export const BatchQueueResultSchema = z.object({
  batch_number: z.string(),
  machine_name: z.string(),
  filename: z.string(),
  queued: z.boolean(),
  locked: z.boolean(),
  pinned: z.boolean(),
  note: z.string(),
})
export type BatchQueueResult = z.infer<typeof BatchQueueResultSchema>

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
  // True when THIS call locked a Draft on the way to sending it. Nullish so an
  // older backend that does not send it still parses.
  locked: z.boolean().nullish(),
  already_sent: z.boolean(),
  note: z.string(),
})

export type PrintBatchResult = z.infer<typeof PrintBatchResultSchema>
