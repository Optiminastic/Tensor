import { z } from 'zod'

/** One value the customer typed at checkout. */
export const PersonalisationFieldSchema = z.object({
  label: z.string(),
  value: z.string(),
  /**
   * False for anything structural. A heart count is not a parameter - it
   * selects a different model file - so letting it be edited would quietly
   * change which product is made.
   */
  editable: z.boolean(),
})

export const PersonalisationItemSchema = z.object({
  job_id: z.string(),
  job_number: z.string(),
  product_name: z.string(),
  quantity: z.number(),
  colour: z.string(),
  colour_hex: z.string(),
  fields: z
    .array(PersonalisationFieldSchema)
    .nullish()
    .transform(v => v ?? []),
  /**
   * Whether there is anything to show yet. The link is sent the moment the
   * order lands and a render is 20-45 seconds behind it, so "not yet" is the
   * ordinary first answer rather than a fault.
   */
  /**
   * Which piece of a multi-part product this is - a Soulmate Combo prints as
   * a plank, a rose and a keychain. Empty for a product that is one piece, so
   * the card says nothing rather than labelling the only thing in the order.
   */
  part: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  /**
   * Whether a picture is coming AT ALL.
   *
   * Tensor renders the plank family and the products the registry describes.
   * It does not render a Bone Tag, a DUOSNAP or a Couple's Date Plank, and
   * nothing ever will - so the card must not sit on "Building your preview…"
   * waiting for a model that does not exist. Those items are their fields and
   * nothing else.
   *
   * Defaulted to true for a backend that predates it, which only ever sent
   * items it renders.
   */
  has_preview: z
    .boolean()
    .nullish()
    .transform(v => v ?? true),
  model_ready: z.boolean(),
  /**
   * Changes when the model does - it is the print file's id, and a re-render
   * mints a new file rather than overwriting the old one.
   *
   * The page needs it because "is there a model" is true both before and
   * after a save: without a version it would poll, see the old file answer,
   * and show the customer the colour they just changed away from.
   */
  model_version: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  /**
   * Which of several identical products this is - "2 of 3".
   *
   * Zero when the order holds only one, so the page says nothing rather than
   * "1 of 1". Counted by the backend from what is on the page, because the
   * line's own quantity reads 1 on each of the three jobs it became.
   */
  unit_index: z
    .number()
    .nullish()
    .transform(v => v ?? 0),
  unit_count: z
    .number()
    .nullish()
    .transform(v => v ?? 0),
})

export const PersonalisationColourSchema = z.object({
  name: z.string(),
  hex: z.string(),
})

export const PersonalisationLinkSchema = z.object({
  order_number: z.string(),
  customer_name: z.string(),
  expires_at: z.string(),
  /** Counted from issue, so this and the sweep cannot disagree. */
  seconds_left: z.number(),
  confirmed: z.boolean(),
  items: z
    .array(PersonalisationItemSchema)
    .nullish()
    .transform(v => v ?? []),
  colours: z
    .array(PersonalisationColourSchema)
    .nullish()
    .transform(v => v ?? []),
})

export type PersonalisationField = z.infer<typeof PersonalisationFieldSchema>
export type PersonalisationItem = z.infer<typeof PersonalisationItemSchema>
export type PersonalisationColour = z.infer<typeof PersonalisationColourSchema>
export type PersonalisationLink = z.infer<typeof PersonalisationLinkSchema>
