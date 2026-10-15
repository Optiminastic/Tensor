import type { CallLog } from '@/lib/validators/call-logs'

/**
 * What the win-back agent costs, as rates.
 *
 * Sarvam's analytics API carries no price on a call, so a call's cost is
 * worked out here from its duration. Change these when the plan changes:
 * they are the only place the numbers live.
 */

/** Sarvam voice agents, pay-as-you-go: one rate covers speech, reasoning and voice. */
export const SARVAM_RUPEES_PER_MINUTE = 3.5

/**
 * The Plivo number the agent calls from: a flat monthly rent, whatever the
 * call volume. Spread across a period by days rather than charged to calls,
 * because no single call causes it.
 */
export const PHONE_NUMBER_RUPEES_PER_MONTH = 200

/**
 * One call's cost, billed per second.
 *
 * A call nobody answered reports no duration and so costs nothing here. If a
 * Sarvam statement ever shows a charge for those, this is where it goes.
 */
export function callCost(call: Pick<CallLog, 'duration_seconds'>): number {
  const seconds = Math.max(0, call.duration_seconds)
  return (seconds / 60) * SARVAM_RUPEES_PER_MINUTE
}

/** The number's rent for a period of `days`, on a 30-day month. */
export function phoneNumberCost(days: number): number {
  return (PHONE_NUMBER_RUPEES_PER_MONTH * days) / 30
}

/** ₹ for a cost: two decimals, because a call is often under a rupee. */
export function rupees(value: number): string {
  return `₹${value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
