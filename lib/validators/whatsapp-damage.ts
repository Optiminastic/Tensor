import { z } from 'zod'

/**
 * A damage report: a customer who filled in the damage form, the photographs
 * and videos they uploaded, and how far anyone has got with it.
 *
 * `file_count` is a single number, and that is a change worth knowing about.
 * The first version of this carried stored/pending/failed counts, because the
 * photographs arrived as WhatsApp attachments that had to be fetched back out
 * of Meta and could still be in flight. They are uploaded straight to Tensor
 * now, so a file the report has is simply there.
 */
export const DamageStatusSchema = z.enum(['new', 'in_review', 'resolved'])
export type DamageStatus = z.infer<typeof DamageStatusSchema>

/**
 * What the shop decided to DO about a damaged parcel, which is a different
 * question from how far along the report is.
 *
 * `''` is undecided. A reprint costs the customer nothing; a reverse asks them
 * for ₹100 for the leg to the warehouse and opens a negotiation that runs over
 * days — see `reverse_state`; `closed` is one support settled in conversation,
 * which is why it is the only outcome whose note is compulsory — the other two
 * leave a waybill or a print job behind them to say what happened, and this one
 * leaves a sentence.
 */
export const DamageResolutionKindSchema = z.enum(['', 'reprint', 'reverse', 'closed'])
export type DamageResolutionKind = z.infer<typeof DamageResolutionKindSchema>

/**
 * How far the ₹100 reverse-pickup negotiation has got. `''` unless reverse.
 *
 * THERE IS NO `agreed`. The ask used to be two messages — an offer with
 * Yes/No buttons, then the QR once they said yes — and it is one now:
 * explanation, QR and "send a screenshot" together. Paying IS agreeing, so
 * `offered` means "asked, waiting on the money" and nothing sits between it
 * and the payment.
 */
export const DamageReverseStateSchema = z.enum([
  '',
  'offered',
  'payment_claimed',
  'paid',
  'pickup_booked',
])
export type DamageReverseState = z.infer<typeof DamageReverseStateSchema>

export const DamageReportSchema = z.object({
  id: z.string(),
  wa_id: z.string(),
  customer_name: z.string(),
  order_number: z.string(),
  shopify_order_gid: z.string(),
  /** Null when the order has not been imported into Tensor. */
  order_id: z
    .string()
    .nullish()
    .transform(v => v ?? null),
  file_count: z.number(),
  status: DamageStatusSchema,
  resolution_note: z.string(),
  resolution_kind: DamageResolutionKindSchema,
  reverse_state: DamageReverseStateSchema,
  reported_at: z.string(),
  status_changed_at: z
    .string()
    .nullish()
    .transform(v => v ?? null),
  status_changed_by: z
    .string()
    .nullish()
    .transform(v => v ?? null),
})

export const DamageReportsResponseSchema = z.object({
  items: z.array(DamageReportSchema),
  /** Per status, plus '' for every report. The '' key matches the orders table. */
  counts: z.record(z.string(), z.number()),
})

export const DamageFileSchema = z.object({
  id: z.string(),
  content_type: z.string(),
  size_bytes: z.number(),
  created_at: z.string(),
})

/**
 * One step of a damaged order's progress.
 *
 * `pending` is not a stored value — it is a step in the plan that has no row
 * yet, which is how the drawer knows what is still to come. A timeline showing
 * only completed steps reads "fine" right up until somebody notices it has
 * been fine for four days.
 */
export const DamageStageSchema = z.object({
  stage: z.string(),
  /** Written for an operator: "Courier booked", not "COURIER_BOOKED". */
  label: z.string(),
  state: z.enum(['done', 'failed', 'skipped', 'pending']),
  /** A waybill, a courier's refusal, why WhatsApp would not send. */
  detail: z.string(),
  actor: z.string().optional(),
  at: z.string().optional(),
})
export type DamageStage = z.infer<typeof DamageStageSchema>

export const DamageReportDetailSchema = z.object({
  report: DamageReportSchema,
  files: z.array(DamageFileSchema),
  /**
   * The payment screenshot the customer sent over WhatsApp, if any.
   *
   * SEPARATE FROM `files` on purpose. Those are photographs of the breakage,
   * uploaded through the public damage form; this answers a different
   * question — "did they pay" — and in the photo grid it would sit among
   * pictures of a cracked product looking like one of them.
   */
  payment_proof: DamageFileSchema.nullish().transform(v => v ?? null),
  stages: z.array(DamageStageSchema),
})

export type DamageReport = z.infer<typeof DamageReportSchema>
export type DamageFile = z.infer<typeof DamageFileSchema>
export type DamageReportDetail = z.infer<typeof DamageReportDetailSchema>
export type DamageReports = z.infer<typeof DamageReportsResponseSchema>

/**
 * What came back from deciding a report's outcome.
 *
 * `message_sent` is its own field and not an inference: telling the customer
 * is best-effort, because a failed send must not undo a decision two people
 * can already see on the board. WhatsApp also refuses free-form outside its
 * 24-hour window, so a perfectly good decision can leave the customer untold —
 * and the screen has to be able to say so.
 */
export const DamageResolutionResultSchema = z.object({
  report: DamageReportSchema,
  message_sent: z.boolean(),
  /** The replacement parcel's waybill, on a reprint that booked one. */
  waybill: z.string().optional().default(''),
  /** How many production jobs went back in the queue, on a reprint. */
  requeued: z.number().optional().default(0),
  /**
   * The step that stopped this, if one did.
   *
   * Carried through rather than inferred from the others: the backend knows
   * which act failed and says so in the operator's words, and a screen
   * guessing from a missing waybill would blame the wrong thing.
   */
  blocked: z.string().optional().default(''),
})
export type DamageResolutionResult = z.infer<typeof DamageResolutionResultSchema>

/**
 * What came back from booking the reverse pickup.
 *
 * The waybill is the whole point: it is the only handle anybody has on a van
 * that is now coming, and the one thing somebody needs to cancel it at
 * Delhivery if the report turns out to be wrong.
 */
export const DamagePickupResultSchema = z.object({
  report: DamageReportSchema,
  waybill: z.string(),
  message_sent: z.boolean(),
})
export type DamagePickupResult = z.infer<typeof DamagePickupResultSchema>

/** What came back from confirming the ₹100. Nothing is sent, so nothing to report. */
export const DamagePaymentResultSchema = z.object({
  report: DamageReportSchema,
})
export type DamagePaymentResult = z.infer<typeof DamagePaymentResultSchema>
