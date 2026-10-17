import { z } from 'zod'

/**
 * The damage form, as the customer's own page sees it.
 *
 * Separate from `whatsapp-damage.ts`, which is the shop's view of a filed
 * report. These two describe the same thing from opposite sides and must not
 * be merged: this one is parsed from an UNAUTHENTICATED response and
 * deliberately carries nothing the shop knows - no status, no resolution
 * note, no customer name, nothing about any other order.
 */
export const DamageFormFileSchema = z.object({
  id: z.string(),
  /** 'image' or 'video'; the page draws them differently. */
  kind: z.string(),
  size_bytes: z.number(),
})

export const DamageFormSchema = z.object({
  /** What they typed last time, so reopening shows the report they filed. */
  order_number: z.string(),
  submitted: z.boolean(),
  expires_at: z.string(),
  files: z.array(DamageFormFileSchema),
  /**
   * The caps, sent by Tensor-Core rather than restated here.
   *
   * They are not advice. An upload over the limit is refused after the whole
   * file has crossed a phone connection, which on a slow line is a minute of
   * someone's life for a sentence the page could have said up front.
   */
  max_files: z.number(),
  max_file_mb: z.number(),
})

export type DamageFormFile = z.infer<typeof DamageFormFileSchema>
export type DamageForm = z.infer<typeof DamageFormSchema>
