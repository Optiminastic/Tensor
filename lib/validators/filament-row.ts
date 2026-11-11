import { z } from 'zod'

/** The Edit action on a filament row: every field, addressed by the row's id. */
export const FilamentEditSchema = z.object({
  material: z.string().trim().min(1, 'Give the material.').max(255),
  colour: z.string().trim().max(255).optional(),
  /** Blank works the dot out from the colour name. */
  colour_hex: z.string().trim().max(9).optional(),
  grams_available: z.number().min(0, 'Stock cannot be negative.'),
  reorder_level_grams: z.number().min(0, 'The reorder level cannot be negative.'),
})
export type FilamentEditInput = z.infer<typeof FilamentEditSchema>
