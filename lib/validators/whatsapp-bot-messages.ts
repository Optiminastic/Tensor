import { z } from 'zod'

/**
 * One message the bot sends outside the menu tree.
 *
 * NOT A TREE NODE. A node is a body with options under it and a shape - tap
 * this, open that - and it has its own editor. These are the one-off lines:
 * the damage form's covering message, the ₹100 ask, "your pickup is booked".
 *
 * `body` is what is sent today and `default` is what ships in the backend, so
 * the page can offer "put this back" without keeping its own copy of wording
 * that belongs to the backend. `edited` says which of the two `body` is.
 */
export const BotNoticeSchema = z.object({
  key: z.string(),
  label: z.string(),
  group: z.string(),
  /** When it is sent — the thing an editor needs and cannot read off the text. */
  help: z.string(),
  body: z.string(),
  default: z.string(),
  edited: z.boolean(),
  /**
   * How many `%s` the wording must contain — where the order number goes.
   *
   * A SAVE THAT LOSES ONE IS REFUSED, by the backend and by the form before
   * it: a message that dropped its placeholder reaches a customer reading
   * "We'll start crafting order  now", and one that gained a second reaches
   * them as `%!s(MISSING)`.
   */
  placeholders: z.number(),
  /** Meta's limit for this message's shape — a button caption is far shorter. */
  limit: z.number(),
})

export const BotNoticesResponseSchema = z.object({
  messages: z.array(BotNoticeSchema),
})

export type BotNotice = z.infer<typeof BotNoticeSchema>
export type BotNotices = z.infer<typeof BotNoticesResponseSchema>
