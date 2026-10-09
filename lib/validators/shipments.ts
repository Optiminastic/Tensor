import { z } from 'zod'

/**
 * Why a parcel has not arrived, as Tensor classifies it.
 *
 * The bucket is a filter over Delhivery's own sentence, not a replacement for
 * it - `instruction` always carries what the carrier actually said. A wording
 * the backend's classifier has not met arrives as `other` with its text intact
 * rather than disappearing, and `untracked` is Tensor's own bucket for a
 * waybill Delhivery does not recognise.
 */
export const ShipmentReasonSchema = z.enum([
  'consignee_unavailable',
  'consignee_refused',
  'address_problem',
  'payment_not_ready',
  'rescheduled',
  'attempts_exhausted',
  'audit',
  'carrier_delay',
  'moving',
  'delivered',
  'other',
  'untracked',
])

/** One scan in the carrier's trail. */
export const ShipmentScanSchema = z.object({
  at: z.string(),
  status: z.string(),
  instruction: z.string(),
  location: z.string(),
  status_code: z.string(),
  scan_type: z.string(),
})

/**
 * One parcel the store has shipped, whatever became of it.
 *
 * Assembled from two upstreams, because neither alone can answer the question:
 * Shopify knows which waybills the store handed out, and Delhivery knows what
 * happened to them. Delhivery has no list-by-status endpoint, so the join is
 * the only way to ask "which of our parcels are stuck".
 */
export const ShipmentSchema = z.object({
  waybill: z.string(),
  carrier: z.string(),
  tracking_url: z.string(),

  reason: ShipmentReasonSchema,
  reason_label: z.string(),
  /** Delhivery's own sentence. Always shown. */
  instruction: z.string(),
  status: z.string(),
  status_type: z.string(),
  status_code: z.string(),
  /** Empty when the event has not happened - never a zeroed date. */
  status_at: z.string(),
  location: z.string(),
  attempts: z.number(),
  first_attempt_at: z.string(),
  promised_at: z.string(),
  expected_at: z.string(),
  /** The parcel has started back to the warehouse: the deadline on every row. */
  returning: z.boolean(),
  /**
   * Whether this row is somebody's work. Decided by the BACKEND, not here: it
   * rests on a measurement about this carrier (a late courier vehicle is the
   * commonest exception and nobody can act on it), which is a fact about
   * Delhivery rather than a presentation choice.
   */
  actionable: z.boolean(),

  customer_name: z.string(),
  phone: z.string(),
  email: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),

  order_name: z.string(),
  order_id: z.number(),
  admin_url: z.string(),
  ordered_at: z.string(),
  shipped_at: z.string(),
  total_amount: z.string(),
  currency: z.string(),
  /** What the courier still has to collect. Zero on a pre-paid order. */
  cod_amount: z.number(),
  line_items: z.array(
    z.object({
      title: z.string(),
      variant_title: z.string(),
      sku: z.string(),
      quantity: z.number(),
    }),
  ),

  scans: z
    .array(ShipmentScanSchema)
    .nullish()
    .transform(scans => scans ?? []),

  /** What the store last heard from the carrier, which lags by hours. */
  shopify_status: z.string(),
  /** False when Delhivery does not recognise the waybill at all. */
  tracked: z.boolean(),
})

export const ShipmentsResponseSchema = z.object({
  items: z.array(ShipmentSchema),
  shop: z.string(),
  /**
   * Every reason bucket with at least one parcel in it, including the ones the
   * page does not open on. Without this, "nothing to show" and "nothing went
   * wrong" look identical.
   */
  counts: z.record(z.string(), z.number()),
  /** How many of those are somebody's work: the number the page leads with. */
  actionable: z.number(),
  shipped: z.number(),
  tracked: z.number(),
  /**
   * Couriers in the window that are not Delhivery, by parcel count. The store
   * also ships by Blue Dart, and this page cannot see where those parcels are.
   */
  other_carriers: z.record(z.string(), z.number()),
  window_days: z.number(),
  generated_at: z.string(),
})

export type ShipmentReason = z.infer<typeof ShipmentReasonSchema>
export type ShipmentScan = z.infer<typeof ShipmentScanSchema>
export type Shipment = z.infer<typeof ShipmentSchema>
export type ShipmentsResponse = z.infer<typeof ShipmentsResponseSchema>
