import { z } from 'zod'

/**
 * The coloured pieces a design file prints as.
 *
 * Split out of registry.ts, which was at its line limit. They belong together
 * anyway: these four schemas are one subject - how a model is divided into
 * objects the slicer can give separate filaments - and nothing else in the
 * registry reads them.
 */

/**
 * One coloured piece of a product's design file.
 *
 * `part_name` is BOTH the `-D PART=` value the renderer asks the .scad for and
 * the object name in the reference 3MF it was read from. They have to agree for
 * the piece to render at all, so they are one value rather than a mapping
 * between two that can drift.
 *
 * An empty `colour_hex` means the piece follows the colour the customer chose.
 * That is the piece a reference file cannot state, which is exactly why it is
 * the one left blank.
 */
export const ColourPartSchema = z.object({
  id: z.string(),
  role: z.string(),
  part_name: z.string(),
  colour_hex: z.string(),
  position: z.number(),
  /**
   * The colourway this piece belongs to, or "" for the product's own scheme -
   * what every variant prints from until it declares something of its own.
   *
   * Nullish because an older backend does not send it, and a missing field
   * reading as "the product's scheme" is the answer that was true before
   * per-variant schemes existed.
   */
  variant_sku: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  /**
   * A piece only some orders have, left out of the rest instead of holding
   * the job.
   *
   * Nullish for the same reason as `variant_sku`, and defaulting to false is
   * the answer that was true before this existed: every configured piece was
   * mandatory, and one that rendered nothing stopped the job.
   */
  optional: z
    .boolean()
    .nullish()
    .transform(v => v ?? false),
})

/** One piece on its way to the backend: a name, and a colour or the customer's. */
export const ColourSchemePartSchema = z.object({
  part_name: z.string().min(1),
  colour_hex: z.string(),
  /**
   * The shop's word for the colour, preferred over the hex when both are sent.
   *
   * A name is resolved against this shop's spools on the backend; a hex is
   * taken literally. Sending the name is what keeps a fixed piece on the
   * filament the shop actually holds rather than the catalogue's idea of it.
   */
  colour_name: z.string().optional(),
  /**
   * Whether the order decides this piece exists - the mirror's verified tick.
   *
   * Omitted rather than sent false by default, so a caller written before
   * this existed keeps meaning "mandatory", which is what the backend
   * defaults to.
   */
  optional: z.boolean().optional(),
})

export const ColourSchemeWriteSchema = z.object({
  variant_sku: z.string(),
  parts: ColourSchemePartSchema.array().min(1),
})

export type ColourSchemeWriteInput = z.infer<typeof ColourSchemeWriteSchema>

export const ColourPartsResponseSchema = z.object({ items: z.array(ColourPartSchema) })

export type ColourPart = z.infer<typeof ColourPartSchema>
