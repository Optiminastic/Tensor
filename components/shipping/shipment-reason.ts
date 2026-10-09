import type { Shipment, ShipmentReason } from '@/lib/validators/shipments'

/**
 * How a reason bucket reads on screen, and how urgent it is.
 *
 * Colour carries meaning here and nothing else: red is a parcel somebody has to
 * act on today, amber is a problem that can wait a day, neutral is information.
 * The reason's own name is always in the badge, so the hue is never the only
 * thing saying what a row is.
 */
export type ShipmentTone = 'danger' | 'warning' | 'neutral' | 'success'

const TONES: Record<ShipmentReason, ShipmentTone> = {
  // Nobody was home. The parcel is on a clock: Delhivery re-attempts a couple
  // of times and then sends it back.
  consignee_unavailable: 'danger',
  // Somebody was home and said no. On its way back already in practice.
  consignee_refused: 'danger',
  // Cannot be re-attempted without new information from the shop.
  address_problem: 'danger',
  payment_not_ready: 'warning',
  // The courier has stopped trying. The parcel is on its way back unless
  // somebody tells Delhivery to go again, which makes it the most urgent row
  // on the page rather than the calmest.
  attempts_exhausted: 'danger',
  // The parcel is lost inside the courier's network. A claim, not a call.
  audit: 'danger',
  // The customer named a day. Not a failure, but it has to be honoured.
  rescheduled: 'warning',
  // Tensor cannot see this parcel at all, which is worse than knowing it failed.
  untracked: 'warning',
  other: 'warning',
  // The courier's own vehicle running late. Nothing to do.
  carrier_delay: 'neutral',
  moving: 'neutral',
  delivered: 'success',
}

export function reasonTone(reason: ShipmentReason): ShipmentTone {
  return TONES[reason] ?? 'neutral'
}

/**
 * The order the filter chips appear in: what somebody came to this page for
 * first, then the rest by how much it matters.
 *
 * `consignee_unavailable` is first because it is the reason this page was
 * asked for. `moving` and `delivered` are last and are not problems - they are
 * most of the list on most days, and they are what makes a quiet page readable
 * as good news rather than as a broken integration.
 */
export const REASON_ORDER: ShipmentReason[] = [
  'consignee_unavailable',
  // Immediately after it, because it is the same story one step later: these
  // are the parcels where nobody was available often enough that Delhivery
  // gave up.
  'attempts_exhausted',
  'consignee_refused',
  'address_problem',
  'audit',
  'payment_not_ready',
  'rescheduled',
  'other',
  'untracked',
  'carrier_delay',
  'moving',
  'delivered',
]

const LABELS: Record<ShipmentReason, string> = {
  consignee_unavailable: 'Consignee unavailable',
  consignee_refused: 'Refused',
  address_problem: 'Address problem',
  payment_not_ready: 'Payment not ready',
  attempts_exhausted: 'Attempts exhausted',
  audit: 'In carrier audit',
  rescheduled: 'Rescheduled',
  carrier_delay: 'Carrier delay',
  moving: 'In transit',
  other: 'Other',
  untracked: 'Not tracked',
  delivered: 'Delivered',
}

export function reasonLabel(reason: ShipmentReason): string {
  return LABELS[reason] ?? reason
}

/**
 * Whole days since the carrier last said anything, or null when it never has.
 *
 * The only number on this page that changes a decision: a parcel silent for
 * four days is nearly out of re-attempts, one silent since this morning is not.
 */
export function daysWaiting(shipment: Shipment, now: Date = new Date()): number | null {
  const stamp = shipment.status_at || shipment.shipped_at
  if (!stamp) return null
  const since = new Date(stamp)
  if (Number.isNaN(since.getTime())) return null
  const elapsed = now.getTime() - since.getTime()
  if (elapsed < 0) return 0
  return Math.floor(elapsed / 86_400_000)
}

/** A date and time in the store's own reading, or an em dash when absent. */
export function when(raw: string): string {
  if (!raw) return '—'
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** A date alone, for a promised-by column where the hour is noise. */
export function day(raw: string): string {
  if (!raw) return '—'
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
