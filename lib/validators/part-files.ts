import { z } from 'zod'

/**
 * A finished file kept against a part.
 *
 * The registry's third kind of file, and the only one Tensor never opens: a
 * sliced .gcode, the .3mf it came from, or the .stl it was modelled as, stored
 * so the file for a part lives with the product rather than on somebody's
 * desktop. Its own module because it is not a design template and not a
 * product - it belongs to a component.
 */
export const PartFileSchema = z.object({
  id: z.string(),
  item_id: z.string(),
  item_name: z.string(),
  item_code: z.string(),
  /** Empty when one file serves every SKU. */
  sku: z.string(),
  machine_family: z.string(),
  filename: z.string(),
  size_bytes: z.number(),
  /** 'gcode', '3mf' or 'stl'. */
  kind: z.string(),
  notes: z.string(),
  uploaded_by: z.string(),
  created_at: z.string(),
})
export type PartFile = z.infer<typeof PartFileSchema>
