import { z } from 'zod'

// The custom-batch dialog's own shapes: the jobs its search offers, and what it
// sends back. Kept out of production.ts, which describes the job lifecycle
// itself — these exist for one dialog and would otherwise be read as part of
// the domain.

/**
 * One plank waiting, as the custom-batch search offers it.
 *
 * Jobs, not orders. The dialog used to list orders on the reasoning that a
 * person building a bed thinks in customers; the shop asked for job numbers,
 * because a named plank is what actually has to go on a plate, and an order row
 * cannot say "that one of the three".
 */
export const BatchableJobSchema = z.object({
  job_id: z.string(),
  job_number: z.string(),
  order_number: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  product: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  units: z.number(),
  /**
   * Opaque, from the backend: two rows may share a bed exactly when theirs
   * match. Not decomposed here — the rule folds in colour normalisation, and a
   * second implementation of that in TypeScript would drift quietly into a
   * plate that prints in the wrong colour.
   */
  compatibility_key: z.string(),
  colour_label: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  available: z
    .boolean()
    .nullish()
    .transform(v => v ?? true),
  unavailable_reason: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  on_bed: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  bed_locked: z
    .boolean()
    .nullish()
    .transform(v => v ?? false),
  reprint: z
    .boolean()
    .nullish()
    .transform(v => v ?? false),
  finished_stage: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
})
export type BatchableJob = z.infer<typeof BatchableJobSchema>

export const BatchableJobsSchema = z.object({
  jobs: BatchableJobSchema.array()
    .nullish()
    .transform(v => v ?? []),
  /**
   * How many jobs matched, which can be more than were returned — a search
   * showing 40 of 180 needs narrowing, and a list that simply stops looks like
   * the answer.
   */
  total: z
    .number()
    .nullish()
    .transform(v => v ?? 0),
  /**
   * The search hit the backend's ceiling, so `total` is a floor rather than a
   * count. Shown as "of 200+", because "40 of 200" out of a table of 369 is a
   * number somebody would take at face value.
   */
  more: z
    .boolean()
    .nullish()
    .transform(v => v ?? false),
  /** How many products one plate holds, so the dialog counts places. */
  units_per_bed: z.number(),
  /**
   * How few a bed may hold and still be worth a machine-hour. A smaller bed can
   * still be built — it simply waits for company before it locks — so this is
   * shown as a note, never as a refusal.
   */
  min_units_per_bed: z
    .number()
    .nullish()
    .transform(v => v ?? 1),
})
export type BatchableJobs = z.infer<typeof BatchableJobsSchema>

export const CustomBatchInputSchema = z.object({
  job_ids: z.string().array().min(1, 'Choose at least one product for this bed.'),
})
export type CustomBatchInput = z.infer<typeof CustomBatchInputSchema>
