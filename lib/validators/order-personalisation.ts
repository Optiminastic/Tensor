import { z } from 'zod'

/**
 * What a customer was asked and what they changed, for the order drawer's
 * Personalisation tab.
 *
 * The message is the one that was sent, frozen on the link row at send time.
 * `reconstructed` is true only for a row written before Tensor started
 * freezing it, whose body is today's template filled with this order's values
 * rather than the words that actually left - a different claim, and the panel
 * says which it is looking at.
 */
export const PersonalisationMessageSchema = z.object({
  template: z.string(),
  language: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  /** The approved copy with this order's values in it. Empty if Meta was unreachable. */
  body: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  /** How many buttons sat under it. Not their labels - see the backend's note. */
  buttons: z
    .number()
    .nullish()
    .transform(v => v ?? 0),
  to: z.string(),
  status: z.string(),
  detail: z.string().nullish(),
  sent_at: z.string().nullish(),
  expires_at: z.string().nullish(),
  reconstructed: z.boolean(),
})

const ChangeSchema = z.object({
  label: z.string(),
  from: z.string(),
  to: z.string(),
})

export const PersonalisationItemChangesSchema = z.object({
  job_id: z.string(),
  job_number: z.string(),
  product_name: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  changes: z
    .array(ChangeSchema)
    .nullish()
    .transform(v => v ?? []),
})

export const OrderPersonalisationSchema = z.object({
  /** Null when this order was never asked - the feature was off, no phone, or it predates the watermark. */
  message: PersonalisationMessageSchema.nullable(),
  /**
   * Why nobody was asked, when nobody was. The rule the sender named, which
   * used to exist only in a log line that went with the container.
   */
  skip_reason: z.string().nullish(),
  items: z
    .array(PersonalisationItemChangesSchema)
    .nullish()
    .transform(v => v ?? []),
})

export type PersonalisationMessage = z.infer<typeof PersonalisationMessageSchema>
export type PersonalisationItemChanges = z.infer<typeof PersonalisationItemChangesSchema>
export type OrderPersonalisation = z.infer<typeof OrderPersonalisationSchema>
