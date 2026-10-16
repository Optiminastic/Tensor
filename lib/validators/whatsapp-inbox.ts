import { z } from 'zod'

/**
 * One customer's WhatsApp conversation, as the inbox's chat list shows it.
 *
 * `mode` says who is answering. "bot" means the menu bot replies to the next
 * message; "human" means a person took over - from this inbox or from the
 * WhatsApp Business app - and the bot stays quiet until handed back.
 *
 * `can_reply` is WhatsApp's own rule, not Tensor's: a free-form reply is only
 * allowed within 24 hours of the customer's last message.
 */
export const WhatsAppConversationSchema = z.object({
  wa_id: z.string(),
  profile_name: z.string(),
  mode: z.enum(['bot', 'human']),
  opted_out: z.boolean(),
  can_reply: z.boolean(),
  last_customer_at: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  last_message_at: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  last_message_preview: z.string(),
})

export const WhatsAppConversationsResponseSchema = z.object({
  items: z.array(WhatsAppConversationSchema),
})

/** Who wrote a message: the customer, the menu bot, or a member of staff. */
export const WhatsAppAuthorSchema = z.enum(['customer', 'bot', 'staff'])

export const WhatsAppMessageSchema = z.object({
  id: z.string(),
  direction: z.enum(['in', 'out', 'echo']),
  author: WhatsAppAuthorSchema,
  kind: z.string(),
  body: z.string(),
  /** Meta's delivery word for a message Tensor sent: accepted, sent, delivered, read, failed. */
  status: z.string(),
  error_code: z
    .number()
    .nullish()
    .transform(v => v ?? null),
  created_at: z.string(),
})

export const WhatsAppThreadResponseSchema = z.object({
  conversation: WhatsAppConversationSchema,
  items: z.array(WhatsAppMessageSchema),
})

/** WhatsApp caps a text message at 4096 characters. */
export const MAX_REPLY_LENGTH = 4096

export const WhatsAppReplySchema = z.object({
  brand: z.string().min(1),
  waId: z.string().regex(/^\d{8,15}$/, 'Not a WhatsApp number.'),
  text: z
    .string()
    .trim()
    .min(1, 'Type a reply first.')
    .max(MAX_REPLY_LENGTH, 'WhatsApp allows at most 4096 characters.'),
})

export const WhatsAppThreadRequestSchema = WhatsAppReplySchema.pick({ brand: true, waId: true })

/** The reply box's own field; the brand and number come from the page. */
export const WhatsAppReplyTextSchema = WhatsAppReplySchema.pick({ text: true })

export type WhatsAppConversation = z.infer<typeof WhatsAppConversationSchema>
export type WhatsAppMessage = z.infer<typeof WhatsAppMessageSchema>
export type WhatsAppThread = z.infer<typeof WhatsAppThreadResponseSchema>
export type WhatsAppReplyInput = z.input<typeof WhatsAppReplySchema>
export type WhatsAppReplyText = z.infer<typeof WhatsAppReplyTextSchema>
