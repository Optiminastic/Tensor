import { z } from 'zod'

/**
 * What the WhatsApp bot says, as the dashboard edits it.
 *
 * Two kinds of row, and they behave differently:
 *
 * - `menu` is one of the three buttons under the greeting. Only the LABEL is
 *   editable; the action behind it is code, because "start the damage flow"
 *   is a conversation with state, lookups and photographs, not a string. That
 *   is what `locked` means on a menu row.
 * - `faq` is a row of the list behind "Other", with the answer it sends.
 *   These are wholly data: a question the code has never heard of still
 *   works, because the bot answers it from the database.
 *
 * `from_code` marks a row the shop has not overridden yet. The page shows it
 * so there is something to edit; saving writes the first stored row.
 */
export const BotContentRowSchema = z.object({
  kind: z.enum(['menu', 'faq']),
  key: z.string(),
  title: z.string(),
  description: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  answer: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  position: z.number(),
  enabled: z.boolean(),
  from_code: z.boolean(),
  locked: z.boolean(),
})

/**
 * WhatsApp's own caps, sent by Tensor-Core rather than duplicated here.
 *
 * They are not advice: Meta refuses the WHOLE message when one row is too
 * long, and names neither the row nor the rule - so the bot would simply stop
 * answering, with nothing on screen to say why.
 */
export const BotContentLimitsSchema = z.object({
  menu_title: z.number(),
  faq_title: z.number(),
  faq_description: z.number(),
  faq_rows: z.number(),
})

export const BotContentSchema = z.object({
  menu: z.array(BotContentRowSchema),
  faq: z.array(BotContentRowSchema),
  limits: BotContentLimitsSchema,
})

export type BotContentRow = z.infer<typeof BotContentRowSchema>
export type BotContentLimits = z.infer<typeof BotContentLimitsSchema>
export type BotContent = z.infer<typeof BotContentSchema>
