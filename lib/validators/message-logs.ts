import { z } from 'zod'

/**
 * How a win-back WhatsApp message ended up.
 *
 * THREE WORDS, deliberately, and none of them is "delivered". Meta's 200 means
 * it accepted the message, not that a phone showed it: it accepts sends to
 * numbers that are not on WhatsApp, and India's per-recipient marketing cap
 * drops accepted messages silently. Measured on this account - a utility
 * template arrived while a marketing one sent in the same minute from the same
 * number did not. Until there is a delivery webhook, "sent" is the strongest
 * claim the data supports.
 *
 * `pending` is a row claimed before the send and never settled after it, which
 * means the worker died in between. The message may or may not have gone, and
 * saying either would be inventing something.
 */
export const MessageLogStatusSchema = z.enum(['sent', 'failed', 'pending'])

export const MessageLogSchema = z.object({
  checkout_id: z.string(),
  checkout_name: z.string(),
  customer_name: z.string(),
  phone: z.string(),

  status: MessageLogStatusSchema,
  /** Why, in the sender's own words - Meta's sentence, or Tensor's. */
  detail: z.string(),
  /** Meta's wamid. Empty when nothing was sent. */
  message_id: z.string(),
  /**
   * The message as the customer saw it - the approved template with this
   * customer's name, basket and code already in it.
   *
   * FROZEN AT SEND TIME, not rendered here. The copy lives at Meta and is
   * edited there, so rendering from today's template would redraw last week's
   * messages in this week's words. Empty for anything sent before Tensor
   * began recording it.
   */
  body: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  /**
   * The whole recovery address behind the button: the discount code, and the
   * redirect back to this customer's own basket. Separate from the body
   * because Meta keeps button URLs out of the body text.
   */
  link: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  attempts: z.number(),
  sent_at: z.string(),
  created_at: z.string(),
})

export const MessageLogsResponseSchema = z.object({ items: z.array(MessageLogSchema) })

export type MessageLogStatus = z.infer<typeof MessageLogStatusSchema>
export type MessageLog = z.infer<typeof MessageLogSchema>

/**
 * The approved template as Meta holds it today, placeholders and all.
 *
 * READ LIVE, unlike a row's own body, because it answers a different
 * question: a row's body is the record of one send and must never change,
 * while this is "what does the agent send", which is whatever the template
 * says now. It is shown only for rows sent before Tensor recorded the words,
 * and labelled as the template rather than as the message - presenting
 * today's copy as last week's message is exactly the rewriting the frozen
 * body exists to prevent.
 */
export const MessageTemplateSchema = z.object({
  name: z.string(),
  language: z.string(),
  /** Meta's own word: APPROVED, PENDING, REJECTED. */
  status: z.string(),
  /** Carries {{1}}…{{5}}, unfilled. */
  body: z.string(),
})

export type MessageTemplate = z.infer<typeof MessageTemplateSchema>
