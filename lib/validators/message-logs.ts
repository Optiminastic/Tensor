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
  attempts: z.number(),
  sent_at: z.string(),
  created_at: z.string(),
})

export const MessageLogsResponseSchema = z.object({ items: z.array(MessageLogSchema) })

export type MessageLogStatus = z.infer<typeof MessageLogStatusSchema>
export type MessageLog = z.infer<typeof MessageLogSchema>
