import { z } from 'zod'

/**
 * One size a product's customer photo prints at on the Custom Photo A4 sheets.
 *
 * Millimetres. A size with `when_field` applies when the order line's field of
 * that name has `when_value` (e.g. photo_frames = 3); one without is the
 * default. A circle's width is its diameter.
 */
export const PhotoSizeSchema = z.object({
  width_mm: z.number(),
  height_mm: z.number(),
  shape: z.enum(['rect', 'circle']),
  when_field: z.string(),
  when_value: z.string(),
})

export type PhotoSize = z.infer<typeof PhotoSizeSchema>

export const PhotoPrintSchema = z.object({
  /** The product's own sizes; empty when none are set. */
  sizes: PhotoSizeSchema.array(),
  /** What Tensor prints it at when `sizes` is empty, by its SKUs. */
  built_in: PhotoSizeSchema.array(),
  sample: z
    .object({
      filename: z.string(),
      size_bytes: z.number(),
      uploaded_by: z.string(),
      uploaded_at: z.string(),
    })
    .nullable(),
})

export type PhotoPrint = z.infer<typeof PhotoPrintSchema>

export type LengthUnit = 'mm' | 'cm'

/** A typed length in millimetres, or null when it is not a positive number. */
export function toMillimetres(value: string, unit: LengthUnit): number | null {
  const n = Number(value.replace(',', '.').trim())
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round((unit === 'cm' ? n * 10 : n) * 10) / 10
}

/** A stored millimetre length shown in the chosen unit. */
export function fromMillimetres(mm: number, unit: LengthUnit): string {
  return String(unit === 'cm' ? Math.round(mm * 10) / 100 : mm)
}

/** "65 × 105 mm", "⌀ 51 mm". */
export function describeSize(size: PhotoSize): string {
  return size.shape === 'circle'
    ? `⌀ ${size.width_mm} mm, round`
    : `${size.width_mm} × ${size.height_mm} mm`
}
