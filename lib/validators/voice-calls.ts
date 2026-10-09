import { z } from 'zod'

/**
 * One outbound call to one customer.
 *
 * Every field here is READ ALOUD by the agent, which is why the limits are
 * about speech rather than storage: a 400-character product name is a valid
 * string and an unlistenable phone call.
 *
 * The fields map onto the agent's own variables, defined in Sarvam's console
 * (Build > Variables): cart_value, customer_name, item_count, Product_name.
 * Sarvam matches them exactly and refuses the call over any it does not know,
 * so this is the agent's contract, not a free-form bag. The exact spellings
 * live in Tensor-Core, which is what talks to Sarvam.
 */
export const VoiceCallSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, 'Who are we calling?')
    .max(80, 'That name is too long to say on a call.'),
  // Not pattern-matched here. The backend normalises how people actually write
  // numbers down - "98765 43210", "098765 43210", "+91 98765-43210" - and a
  // browser regex that rejects two of those makes the form infuriating while
  // adding no safety.
  customerNumber: z
    .string()
    .trim()
    .min(8, 'That is too short to be a phone number.')
    .max(20, 'That is too long to be a phone number.'),
  productName: z.string().trim().max(160, 'That product name is too long to say on a call.'),
  cartValue: z.string().trim().max(24, 'That value is too long to say on a call.'),
  itemCount: z
    .number()
    .int()
    .min(0)
    .max(999, 'That is more items than anyone puts in one basket.')
    .optional(),
})

export type VoiceCallInput = z.infer<typeof VoiceCallSchema>

/** Sarvam's acknowledgement. The attempt id finds the call in its logs. */
export const VoiceCallResultSchema = z.object({
  attempt_id: z.string(),
})

export type VoiceCallResult = z.infer<typeof VoiceCallResultSchema>

/**
 * Whether calling is switched on, and the number the customer will see.
 *
 * Both worth knowing before anyone presses Call: "not configured" is a setup
 * problem with a known fix, and a wrong caller ID is the sort of thing nobody
 * notices until a customer rings it back.
 */
export const VoiceStatusSchema = z.object({
  configured: z.boolean(),
  from_number: z.string(),
})

export type VoiceStatus = z.infer<typeof VoiceStatusSchema>
