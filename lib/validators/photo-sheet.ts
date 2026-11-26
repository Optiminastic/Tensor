import { z } from 'zod'

/**
 * What Tensor-Core laid out on the custom photo sheets, sent back in the
 * X-Photo-Sheet header beside the file.
 *
 * `utilisation` is the share of each A4 page covered by photo, 0..1, sheet by
 * sheet. `skipped` names every order or photo left out, and why.
 */
export const PhotoSheetSummarySchema = z.object({
  sheets: z.number(),
  photos: z.number(),
  utilisation: z.number().array().nullable(),
  skipped: z.string().array().nullable(),
})

export type PhotoSheetSummary = z.infer<typeof PhotoSheetSummarySchema>

/** Reads the header, or null when it is missing or not the expected shape. */
export function parsePhotoSheetSummary(header: string | null): PhotoSheetSummary | null {
  if (!header) return null
  try {
    const parsed = PhotoSheetSummarySchema.safeParse(JSON.parse(header))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}
