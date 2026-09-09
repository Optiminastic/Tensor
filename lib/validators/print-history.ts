import { z } from 'zod'

/**
 * BambuBuddy's print history, mirroring Tensor-Core's /printing/history DTO.
 *
 * The sibling of print-queue.ts and read the same way: through to BambuBuddy on
 * every request, never stored. The two together are the whole board - what is
 * waiting, and what happened.
 *
 * This tab used to list Tensor's own batches with status 'completed', which is
 * a record of Tensor's intentions rather than of the floor: a plate that FAILED
 * on the printer never appeared, and neither did a plate somebody ran straight
 * from BambuBuddy. Both are exactly what an operator opens a history for.
 */
export const ArchiveSchema = z.object({
  id: z.number(),
  name: z.string(),
  // Passed through rather than parsed to an enum, matching QueueItemSchema:
  // BambuBuddy may add a status Tensor has not heard of, and a board that
  // fails to load is worse than one showing an unfamiliar word.
  status: z.string(),
  printer_id: z.number().nullish(),
  printer_name: z.string(),
  // A path on Tensor-Core, proxied - BambuBuddy sits on a tailnet the browser
  // need not reach, and its thumbnail routes want the API key.
  thumbnail_url: z.string().nullish(),

  // The slicer's estimate and what the printer actually took. Both are sent so
  // the board can say a plate ran long, which is most of the point of keeping
  // a history; duration_seconds is the actual, falling back to the estimate.
  print_time_seconds: z.number(),
  actual_time_seconds: z.number(),
  duration_seconds: z.number(),
  filament_used_grams: z.number(),
  filament_actual_grams: z.number(),

  filament_type: z.string(),
  // One entry per material on the plate.
  filament_colours: z.string().array().nullish(),
  cost: z.number().nullish(),
  energy_cost: z.number().nullish(),
  energy_kwh: z.number().nullish(),

  quantity: z.number(),
  layer_height: z.number().nullish(),
  nozzle_diameter: z.number().nullish(),
  bed_type: z.string(),
  sliced_for_model: z.string(),

  // One archive can be reprinted; the counts are how a repeatedly-failing
  // plate is spotted rather than quietly re-run.
  run_count: z.number(),
  successful_run_count: z.number(),
  failed_run_count: z.number(),
  // BambuBuddy's own wording for why the print stopped.
  failure_reason: z.string(),

  created_by: z.string(),
  created_at: z.string(),
  started_at: z.string(),
  completed_at: z.string(),
})
export type Archive = z.infer<typeof ArchiveSchema>

/** Statuses that mean the print is no longer running. */
export const FINISHED_ARCHIVE_STATUSES = ['completed', 'failed', 'cancelled'] as const

/** Whether a history row failed, which is the one an operator must act on. */
export function archiveFailed(a: Archive): boolean {
  return a.status === 'failed'
}
