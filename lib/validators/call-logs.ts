import { z } from 'zod'

/**
 * One call the win-back agent made.
 *
 * Half of it is Sarvam's - what happened on the phone - and half is Tensor's:
 * which abandoned basket the call was about. Neither is much use alone, so the
 * backend joins them and this is the joined shape.
 *
 * `summary` and `disposition` are the AGENT'S own output variables, written by
 * Sarvam at the end of the call. Tensor computes neither.
 */
export const CallLogSchema = z.object({
  attempt_id: z.string(),
  /** Addresses the transcript and the recording. Carries slashes and colons. */
  interaction_id: z.string(),
  started_at: z.string(),
  /** Whether anybody picked up. `failure_reason` says why not. */
  connected: z.boolean(),
  failure_reason: z.string(),
  ended_by: z.string(),
  duration_seconds: z.number(),
  messages: z.number(),
  language: z.string(),
  /**
   * Masked, and NOT always a phone number: a call placed from Sarvam's own
   * console carries the tester's email instead.
   */
  phone: z.string(),
  /** Placed in Sarvam's console rather than by Tensor - somebody testing. */
  from_console: z.boolean().default(false),
  recording_url: z.string(),
  summary: z.string(),
  disposition: z.string(),

  /** The basket. Empty when nothing matched - a test call to a number that
   * never abandoned anything is real and uninteresting. */
  checkout_id: z.string(),
  checkout_name: z.string(),
  customer_name: z.string(),
  /** 'attempt' is an exact join, 'phone' a best-effort one, '' no match. */
  matched_by: z.string(),
})

export const CallLogsResponseSchema = z.object({ items: z.array(CallLogSchema) })

export const TranscriptTurnSchema = z.object({
  turn: z.number(),
  /** 'assistant' is Riya, 'user' is the customer. */
  role: z.string(),
  content: z.string(),
})

export const TranscriptSchema = z.object({
  interaction_id: z.string(),
  turns: z.array(TranscriptTurnSchema),
})

export type CallLog = z.infer<typeof CallLogSchema>
export type TranscriptTurn = z.infer<typeof TranscriptTurnSchema>
export type Transcript = z.infer<typeof TranscriptSchema>
