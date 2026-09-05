import type { PillTone } from '@/components/production/tone-pill'
import type {
  AssemblyStatus,
  BatchStatus,
  JobStatus,
  MachineStatus,
  ModelStatus,
  OrderStatus,
  PackagingStatus,
  PersonalisationStatus,
  QcStatus,
  QueueStatus,
} from '@/components/production/types'
import type { DispatchStatus } from '@/lib/validators/dispatch'
import type { FleetMachineStatus } from '@/lib/validators/machine-fleet'

export const JOB_STATUS_CONFIG: Record<JobStatus, { label: string; tone: PillTone }> = {
  completed: { label: 'Completed', tone: 'success' },
  printing: { label: 'Printing', tone: 'accent' },
  queued: { label: 'Queued', tone: 'muted' },
  failed: { label: 'Failed', tone: 'danger' },
}

export const MACHINE_STATUS_CONFIG: Record<MachineStatus, { label: string; tone: PillTone }> = {
  printing: { label: 'Printing', tone: 'accent' },
  idle: { label: 'Idle', tone: 'success' },
  offline: { label: 'Offline', tone: 'danger' },
}

export const QUEUE_STATUS_CONFIG: Record<QueueStatus, { label: string; tone: PillTone }> = {
  queued: { label: 'Queued', tone: 'muted' },
  in_progress: { label: 'In Progress', tone: 'accent' },
  on_hold: { label: 'On Hold', tone: 'warning' },
  completed: { label: 'Completed', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
}

export const PERSONALISATION_STATUS_CONFIG: Record<
  PersonalisationStatus,
  { label: string; tone: PillTone }
> = {
  not_required: { label: 'None', tone: 'muted' },
  required: { label: 'Pending', tone: 'warning' },
  completed: { label: 'Verified', tone: 'success' },
}

export const ASSEMBLY_STATUS_CONFIG: Record<AssemblyStatus, { label: string; tone: PillTone }> = {
  pending: { label: 'Pending', tone: 'warning' },
  completed: { label: 'Completed', tone: 'success' },
  not_required: { label: 'Not required', tone: 'muted' },
}

export const QC_STATUS_CONFIG: Record<QcStatus, { label: string; tone: PillTone }> = {
  pending: { label: 'Pending', tone: 'warning' },
  passed: { label: 'Passed', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
}

export const PACKAGING_STATUS_CONFIG: Record<PackagingStatus, { label: string; tone: PillTone }> = {
  pending: { label: 'Pending', tone: 'warning' },
  packed: { label: 'Packed', tone: 'success' },
}

export const DISPATCH_STATUS_CONFIG: Record<DispatchStatus, { label: string; tone: PillTone }> = {
  pending: { label: 'Booked', tone: 'warning' },
  dispatched: { label: 'Dispatched', tone: 'success' },
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; tone: PillTone }> = {
  paid: { label: 'Paid', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  refunded: { label: 'Refunded', tone: 'muted' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
}

export const BATCH_STATUS_CONFIG: Record<BatchStatus, { label: string; tone: PillTone }> = {
  pending_approval: { label: 'Draft', tone: 'warning' },
  open: { label: 'Locked', tone: 'accent' },
  in_progress: { label: 'Printing', tone: 'accent' },
  completed: { label: 'Completed', tone: 'success' },
}

export const FLEET_MACHINE_STATUS_CONFIG: Record<
  FleetMachineStatus,
  { label: string; tone: PillTone }
> = {
  idle: { label: 'Idle', tone: 'success' },
  running: { label: 'Running', tone: 'accent' },
  off: { label: 'Off', tone: 'muted' },
  error: { label: 'Error', tone: 'danger' },
}

/**
 * BambuBuddy's own queue-item statuses.
 *
 * Its vocabulary, not Tensor's: this board shows what BambuBuddy is doing, and
 * renaming its states would make the two look like they disagree when an
 * operator has both open.
 *
 * Distinct from QUEUE_STATUS_CONFIG above, which maps Tensor's own production
 * job statuses. The two describe different queues and must not be merged: a
 * job is queued work, a BambuBuddy item is a plate already handed to a printer.
 */
export const BAMBU_QUEUE_STATUS_CONFIG: Record<string, { label: string; tone: PillTone }> = {
  pending: { label: 'Pending', tone: 'warning' },
  printing: { label: 'Printing', tone: 'accent' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'muted' },
  failed: { label: 'Failed', tone: 'danger' },
}

/**
 * The pill for a queue status, tolerating one this build has not heard of.
 *
 * BambuBuddy may add a status at any time, and a queue board that fails to
 * render because of an unfamiliar word would be a worse outcome than showing
 * the word itself.
 */
export function queueStatusConfig(status: string): { label: string; tone: PillTone } {
  return BAMBU_QUEUE_STATUS_CONFIG[status] ?? { label: status, tone: 'muted' }
}

/**
 * Shopify's fulfilment, delivery and return vocabularies.
 *
 * Its words, Tensor's typography: the labels match what an operator reads in
 * Shopify so the two can be compared at a glance, but the pill is Tensor's
 * own - no yellow banner, no borrowed chrome.
 *
 * Unknown values fall through to a neutral pill rather than breaking the row.
 * Shopify adds statuses, and an orders list that fails to render because of one
 * unfamiliar word would be a far worse outcome than showing the word.
 */
const SHOPIFY_STATUS_CONFIG: Record<string, { label: string; tone: PillTone }> = {
  // Fulfilment
  unfulfilled: { label: 'Unfulfilled', tone: 'warning' },
  fulfilled: { label: 'Fulfilled', tone: 'success' },
  partially_fulfilled: { label: 'Partial', tone: 'warning' },
  scheduled: { label: 'Scheduled', tone: 'muted' },
  on_hold: { label: 'On hold', tone: 'warning' },
  // Delivery, from the first fulfilment
  label_printed: { label: 'Label printed', tone: 'muted' },
  label_purchased: { label: 'Label purchased', tone: 'muted' },
  attempted_delivery: { label: 'Attempted', tone: 'warning' },
  in_transit: { label: 'In transit', tone: 'accent' },
  out_for_delivery: { label: 'Out for delivery', tone: 'accent' },
  delivered: { label: 'Delivered', tone: 'success' },
  confirmed: { label: 'Confirmed', tone: 'muted' },
  failure: { label: 'Failed', tone: 'danger' },
  // Returns
  no_return: { label: '—', tone: 'muted' },
  return_requested: { label: 'Requested', tone: 'warning' },
  return_in_progress: { label: 'In progress', tone: 'warning' },
  in_progress: { label: 'In progress', tone: 'warning' },
  returned: { label: 'Returned', tone: 'danger' },
  inspection_complete: { label: 'Inspected', tone: 'muted' },
}

/** The pill for one of Shopify's statuses, tolerating an unfamiliar value. */
export function shopifyStatusConfig(status: string): { label: string; tone: PillTone } {
  const key = status.trim().toLowerCase()
  return (
    SHOPIFY_STATUS_CONFIG[key] ?? {
      // Shopify's own casing is SCREAMING_SNAKE; render it as words rather
      // than shouting it at the operator.
      label: key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()),
      tone: 'muted',
    }
  )
}

/**
 * Where a job's geometry comes from, and whether anyone is waiting on it.
 *
 * The distinction is the whole point: a Dual Name Plank is built from the
 * customer's own two names and needs nobody, while every other product waits
 * for a person to supply a model - and supplying it IS the approval, since
 * attaching a file is what releases the job into batching.
 *
 * 'ready' has no pill. A job that needs nothing should say nothing; a badge on
 * every healthy row is what stops anyone noticing the rows that are not.
 */
export const MODEL_STATUS_CONFIG: Record<ModelStatus, { label: string; tone: PillTone }> = {
  // The model is built and scaled to the finished size, and the job can print.
  ready: { label: 'Done', tone: 'success' },
  // Being rendered right now. Clears on its own; nobody need do anything.
  generating: { label: 'Creating', tone: 'warning' },
  // The render will not succeed on its own. Distinct from 'creating' because
  // the job looks identical otherwise, and the difference is whether anyone
  // has to act.
  failed: { label: 'Oops', tone: 'danger' },
  // Not a product Tensor can build. Somebody has to supply the model, and
  // supplying it is the approval.
  approval_required: { label: 'Approval required', tone: 'warning' },
}
