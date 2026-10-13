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
  model_ready: z.boolean(),
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
