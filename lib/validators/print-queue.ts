import { z } from 'zod'

/**
 * BambuBuddy's print queue, mirroring Tensor-Core's /printing/queue DTO.
 *
 * Read through to BambuBuddy on every request rather than stored: once a plate
 * is sent, BambuBuddy owns what happens to it, and an operator can reorder or
 * cancel an item in BambuBuddy's own UI at any moment. A copy in Tensor would
 * be stale from that point with nothing on screen admitting it.
 */
export const QueueItemStatusSchema = z.enum([
  'pending',
  'printing',
  'completed',
  'cancelled',
  'failed',
])
export type QueueItemStatus = z.infer<typeof QueueItemStatusSchema>

export const QueueItemSchema = z.object({
  id: z.number(),
  // Position within its own printer's queue, so it is not unique across the
  // list - two printers both have a position 1.
  position: z.number(),
  // Passed through rather than parsed to the enum: BambuBuddy may add a status
  // Tensor has not heard of, and a queue board that fails to load is worse
  // than one showing an unfamiliar word.
  status: z.string(),
  name: z.string(),
  printer_id: z.number().nullish(),
  printer_name: z.string(),
  // A path on Tensor-Core, proxied - BambuBuddy sits on a tailnet the browser
  // need not reach, and its thumbnail routes want the API key.
  thumbnail_url: z.string().nullish(),
  print_time_seconds: z.number(),
  filament_used_grams: z.number(),
  filament_type: z.string(),
  // One entry per material on the plate.
  filament_colours: z.string().array().nullish(),
  estimated_cost: z.number().nullish(),
  nozzle_diameter: z.number().nullish(),
  layer_height: z.number().nullish(),
  bed_type: z.string(),
  // The printer model the plate was sliced for. A plate cannot run on another
  // model, which is what makes an item's machine binding meaningful.
  sliced_for_model: z.string(),
  batch_name: z.string(),
  created_by: z.string(),
  created_at: z.string(),
  started_at: z.string(),
  completed_at: z.string(),
  // BambuBuddy's own wording for why an item is stuck or how it failed.
  waiting_reason: z.string(),
  error_message: z.string(),
})
export type QueueItem = z.infer<typeof QueueItemSchema>
