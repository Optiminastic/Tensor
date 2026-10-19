import { z } from 'zod'

/**
 * A damage report: a customer who filled in the damage form, the photographs
 * and videos they uploaded, and how far anyone has got with it.
 *
 * `file_count` is a single number, and that is a change worth knowing about.
 * The first version of this carried stored/pending/failed counts, because the
 * photographs arrived as WhatsApp attachments that had to be fetched back out
 * of Meta and could still be in flight. They are uploaded straight to Tensor
 * now, so a file the report has is simply there.
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
  file_count: z.number(),
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

export const DamageFileSchema = z.object({
  id: z.string(),
  content_type: z.string(),
  size_bytes: z.number(),
  created_at: z.string(),
})

export const DamageReportDetailSchema = z.object({
  report: DamageReportSchema,
  files: z.array(DamageFileSchema),
})

export type DamageReport = z.infer<typeof DamageReportSchema>
export type DamageFile = z.infer<typeof DamageFileSchema>
export type DamageReportDetail = z.infer<typeof DamageReportDetailSchema>
export type DamageReports = z.infer<typeof DamageReportsResponseSchema>
