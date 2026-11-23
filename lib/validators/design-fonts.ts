import { z } from 'zod'

/**
 * A font file uploaded for design templates (Tensor-Core /registry/fonts).
 *
 * `families` are the names a .scad can use for it, lower-cased - the font's
 * family and, when it declares one, its typographic family.
 */
export const DesignFontSchema = z.object({
  id: z.string(),
  families: z.string().array(),
  style: z.string(),
  filename: z.string(),
  size_bytes: z.number(),
  uploaded_by: z.string(),
  created_at: z.string(),
})

export type DesignFont = z.infer<typeof DesignFontSchema>

/** The desktop font formats Tensor-Core accepts. */
export const FONT_FILE_EXTENSIONS = ['.ttf', '.otf'] as const

/** Whether a chosen file is a font rather than a design file. */
export function isFontFile(name: string): boolean {
  const lower = name.toLowerCase()
  return FONT_FILE_EXTENSIONS.some(ext => lower.endsWith(ext))
}
