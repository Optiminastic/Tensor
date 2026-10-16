import { z } from 'zod'

/**
 * A damage report: a customer who told the WhatsApp bot their order arrived
 * broken, the photographs they sent, and how far anyone has got with it.
 *
 * `photo_count` is what the customer sent. `photos_stored`, `photos_pending`
 * and `photos_failed` are what Tensor actually holds - which is a different
 * number, and the one that decides whether the report can be worked at all.
 */
export const DamageStatusSchema = z.enum(['new', 'in_review', 'resolved'])
export type DamageStatus = z.infer<typeof DamageStatusSchema>

export const DamageReportSchema = z.object({
  id: z.string(),
  wa_id: z.string(),
  customer_name: z.string(),
  order_number: z.string(),
  shopify_order_gid: z.string(),
  /** Null when the order has not been imported into Tensor. */
  order_id: z
    .string()
    .nullish()
    .transform(v => v ?? null),
  photo_count: z.number(),
  photos_stored: z.number(),
  photos_pending: z.number(),
  photos_failed: z.number(),
  status: DamageStatusSchema,
  resolution_note: z.string(),
  reported_at: z.string(),
  status_changed_at: z
    .string()
    .nullish()
    .transform(v => v ?? null),
  status_changed_by: z
    .string()
    .nullish()
    .transform(v => v ?? null),
})

export const DamageReportsResponseSchema = z.object({
  items: z.array(DamageReportSchema),
  /** Per status, plus '' for every report. The '' key matches the orders table. */
  counts: z.record(z.string(), z.number()),
})

export const DamagePhotoSchema = z.object({
  message_id: z.string(),
  kind: z.string(),
  /** What the customer typed alongside the photograph. */
  caption: z.string(),
  media_status: z.string(),
  mime_type: z.string(),
  media_error: z.string(),
  created_at: z.string(),
})

export const DamageReportDetailSchema = z.object({
  report: DamageReportSchema,
  photos: z.array(DamagePhotoSchema),
})

export type DamageReport = z.infer<typeof DamageReportSchema>
export type DamagePhoto = z.infer<typeof DamagePhotoSchema>
export type DamageReportDetail = z.infer<typeof DamageReportDetailSchema>
export type DamageReports = z.infer<typeof DamageReportsResponseSchema>
