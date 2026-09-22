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
 * A spool physically loaded in a printer, and what the shop calls it.
 *
 * Every loaded spool, named or not. Listing only the unnamed ones made the
 * panel empty itself as it was filled, which read as progress and hid the one
 * thing still worth doing: a spool named GOLD in haste has to be nameable as
 * something else, and a spool nobody has looked at yet has to stay visible
 * beside the ones that have.
 *
 * `nearest_known_name` is a suggestion from the closest colour Tensor already
 * knows, offered only for a spool nobody has named — never written on its own.
 * Auto-adopting it would be the same guess the colour map exists to replace.
 */
export const LoadedColourSchema = z.object({
  hex: z.string(),
  machines: z
    .string()
    .array()
    .nullish()
    .transform(v => v ?? []),
  /** What the shop calls it, empty when nobody has said. */
  mapped_as: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  /** The colour_map row recording it, so it can be corrected in place. */
  entry_id: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  /** True when models of that colour are rendered and sliced in this spool. */
  is_primary: z
    .boolean()
    .nullish()
    .transform(v => v ?? false),
  /**
   * What the filament's MANUFACTURER calls this exact hex, from BambuBuddy's
   * shipped colour list — "Latte Brown" for #D3B7A7. Empty for a generic spool
   * nobody registered, which is most of this fleet.
   */
  catalogue_name: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  /** Who calls it that, so the suggestion can be judged rather than trusted. */
  catalogue_brand: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  /** The weaker fallback: the closest colour Tensor already knows. */
  nearest_known_name: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
})
export type LoadedColour = z.infer<typeof LoadedColourSchema>

export const ColourMapUpsertSchema = z.object({
  colour_name: z.string().min(1, 'Name the colour, e.g. BLUE.'),
  hex: z
    .string()
    .min(1, 'A colour value is required.')
    .regex(/^#?[0-9a-fA-F]{6}$/, 'Use a six-digit hex, e.g. #2850E0.'),
  is_primary: z.boolean().optional(),
  note: z.string().max(500).nullish(),
})
export type ColourMapUpsert = z.infer<typeof ColourMapUpsertSchema>

/**
 * Correcting a spool already recorded: move it to another colour, fix its
 * value, or make it the one that prints.
 *
 * Every field optional because each is a separate correction; sending only the
 * one that changed keeps an edit from quietly restating the rest.
 */
export const ColourMapPatchSchema = z.object({
  colour_name: z.string().min(1).optional(),
  hex: z
    .string()
    .regex(/^#?[0-9a-fA-F]{6}$/, 'Use a six-digit hex, e.g. #2850E0.')
    .optional(),
  is_primary: z.boolean().optional(),
  note: z.string().max(500).nullish(),
})
export type ColourMapPatch = z.infer<typeof ColourMapPatchSchema>
