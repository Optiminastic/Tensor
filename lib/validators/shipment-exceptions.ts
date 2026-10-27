import { z } from 'zod'

/**
 * Delhivery's own exception queue.
 *
 * SEPARATE FROM `shipments.ts` BECAUSE IT IS A SEPARATE API. That file models
 * the carrier's tracking feed - where a parcel got to. This models Delhivery
 * One's exception queue - whose decision a parcel is waiting on. They disagree
 * routinely and correctly: a parcel the tracking feed calls undelivered can be
 * one Delhivery has already rebooked and wants nothing from us about.
 */

/** One button, taken from the row's own `cta_list`. */
export const ExceptionActionSchema = z.object({
  /** Delhivery's code, e.g. CTA023. Sent back verbatim to act. */
  code: z.string(),
  /** Delhivery's words for it, e.g. "Reattempt shipment". */
  label: z.string(),
})

export const ShipmentExceptionSchema = z.object({
  id: z.string(),
  waybill: z.string(),
  /**
   * The tab Delhivery files this row under, in their spelling
   * ("Need Action", "Auto Re-attempt"). Displayed, never recomputed.
   */
  tab: z.string(),
  bucket: z.string(),
  bucket_name: z.string(),
  /**
   * The actions Delhivery offers for THIS row. Empty is meaningful: it means
   * there is nothing to press, not that the buttons failed to load.
   */
  actions: z.array(ExceptionActionSchema),

  reason: z.string(),
  status: z.string(),
  payment: z.string(),
  attempts: z.number(),
  actionable: z.string(),

  raised_at: z.string(),
  sla_at: z.string(),
  promised_at: z.string(),
  last_update: z.string(),
  sla_breached: z.boolean(),

  /** The proofs that decide whether another van is worth paying for. */
  geofence: z.boolean(),
  geofence_distance: z.number(),
  call_attempted: z.boolean(),
  call_duration: z.number(),
  whatsapp_verified: z.boolean(),

  /** From Shopify when the waybill is known there. Blank is normal. */
  order_name: z.string(),
  customer_name: z.string(),
  city: z.string(),
  admin_url: z.string(),
  tracking_url: z.string(),
})

export const ExceptionTabSchema = z.object({
  /** Delhivery's filter value, e.g. NEED_ACTION. */
  key: z.string(),
  label: z.string(),
  count: z.number(),
  /**
   * Delhivery's words when this one tab failed while the others answered.
   * One bad tab must not read as an empty one.
   */
  error: z
    .string()
    .nullish()
    .transform(value => value ?? ''),
  items: z.array(ShipmentExceptionSchema),
})

export const ShipmentExceptionsResponseSchema = z.object({
  /**
   * False when the brand has no Delhivery One credential. The page then shows
   * what to add rather than an empty queue, which would read as "nothing is
   * stuck" - the most expensive wrong answer this screen can give.
   */
  connected: z.boolean(),
  tabs: z.array(ExceptionTabSchema),
  /** Whether order numbers could be resolved. False means waybills only. */
  enriched: z.boolean(),
  fetched_at: z.string(),
})

export const ExceptionActionResultSchema = z.object({
  exception_id: z.string(),
  code: z.string(),
  /** Delhivery has the instruction. It has not acted on it yet. */
  submitted: z.boolean(),
})

export type ExceptionAction = z.infer<typeof ExceptionActionSchema>
export type ShipmentException = z.infer<typeof ShipmentExceptionSchema>
export type ExceptionTab = z.infer<typeof ExceptionTabSchema>
export type ShipmentExceptionsResponse = z.infer<typeof ShipmentExceptionsResponseSchema>
export type ExceptionActionResult = z.infer<typeof ExceptionActionResultSchema>
