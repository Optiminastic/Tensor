import { z } from 'zod'

// Mirrors Tensor-Core's colour_map.go. The table answers one question the rest
// of the system cannot: an order names a colour in words ("BLUE"), an AMS
// reports one as a bare hex ("#2850E0") with no name attached, and nothing else
// holds both. An operator standing at the printer records the pair.

/**
 * One confirmed pairing of a shop colour name and a hex a printer reports.
 *
 * A name accepts several hexes because thirteen printers do not agree on blue;
 * exactly one is primary, and that is the swatch used when rendering a model
 * and when the queue dialog draws the bed's colours.
 */
export const ColourMapEntrySchema = z.object({
  id: z.string(),
  colour_name: z.string(),
  hex: z.string(),
  is_primary: z.boolean(),
  note: z.string().nullish(),
  confirmed_by: z.string().nullish(),
  confirmed_at: z.string().nullish(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type ColourMapEntry = z.infer<typeof ColourMapEntrySchema>

/**
 * A spool physically loaded in a printer that Tensor cannot name.
 *
 * `nearest_known_name` is a suggestion from the closest colour Tensor already
 * knows — never written on its own. Auto-adopting it would be the same guess
 * the colour map exists to replace.
 */
export const UnmappedColourSchema = z.object({
  hex: z.string(),
  machines: z
    .string()
    .array()
    .nullish()
    .transform(v => v ?? []),
  nearest_known_name: z.string(),
})
export type UnmappedColour = z.infer<typeof UnmappedColourSchema>

export const ColourMapUpsertSchema = z.object({
  colour_name: z.string().min(1, 'Name the colour, e.g. BLUE.'),
  hex: z.string().min(1, 'A colour value is required.'),
  is_primary: z.boolean().optional(),
  note: z.string().max(500).nullish(),
})
export type ColourMapUpsert = z.infer<typeof ColourMapUpsertSchema>
