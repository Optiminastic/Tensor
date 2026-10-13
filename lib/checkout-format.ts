import type { AbandonedCheckout } from '@/lib/validators/abandoned-checkouts'
import type { CallLog } from '@/lib/validators/call-logs'
import type { MessageLog } from '@/lib/validators/message-logs'

/** ₹ with Indian grouping, from Shopify's decimal string. */
export function money(amount: string, currency: string): string {
  const value = Number(amount)
  if (!Number.isFinite(value)) return `${amount} ${currency}`
  const symbol = currency === 'INR' ? '₹' : `${currency} `
  return `${symbol}${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

/**
 * How hot a basket still is.
 *
 * Colour here is state, not decoration: a cart abandoned an hour ago is worth
 * a call and one from last Tuesday is not, so the tone is the thing an
 * operator scans the column for. Three bands rather than a gradient - a reader
 * needs "act now / today / cold", not twelve shades.
 */
export function freshness(iso: string): 'accent' | 'warning' | 'neutral' {
  const hours = (Date.now() - new Date(iso).getTime()) / 3_600_000
  if (!Number.isFinite(hours)) return 'neutral'
  if (hours <= 3) return 'accent'
  if (hours <= 24) return 'warning'
  return 'neutral'
}

export function sinceWhen(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return '—'
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60_000))
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

/** "13 Oct 2026, 11:03 am" - the exact moment, beside the relative one. */
export function fullDate(iso: string): string {
  if (!iso) return '—'
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return iso
  return parsed.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** What the agent did about one checkout: every call and every message. */
export interface CheckoutActivity {
  /** Newest first. */
  calls: CallLog[]
  /** Newest first. */
  messages: MessageLog[]
}

/** Sarvam's call times carry no zone and are UTC. */
function callMillis(call: CallLog): number {
  const raw = call.started_at
  return Date.parse(raw.endsWith('Z') ? raw : `${raw}Z`)
}

/**
 * Groups the calls and messages by the checkout they were about.
 *
 * On `checkout_id`, which the backend fills with the same Shopify id the list
 * carries - for a phone-matched call as well as an exact one. A call that
 * matched no checkout (a console test) has nowhere to go and is left out.
 */
export function groupActivity(
  calls: CallLog[],
  messages: MessageLog[],
): Map<string, CheckoutActivity> {
  const byCheckout = new Map<string, CheckoutActivity>()
  const slot = (id: string): CheckoutActivity => {
    let entry = byCheckout.get(id)
    if (!entry) {
      entry = { calls: [], messages: [] }
      byCheckout.set(id, entry)
    }
    return entry
  }
  for (const call of calls) if (call.checkout_id) slot(call.checkout_id).calls.push(call)
  for (const message of messages) {
    if (message.checkout_id) slot(message.checkout_id).messages.push(message)
  }
  for (const entry of byCheckout.values()) {
    entry.calls.sort((a, b) => callMillis(b) - callMillis(a))
    entry.messages.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
  }
  return byCheckout
}

export const NO_ACTIVITY: CheckoutActivity = { calls: [], messages: [] }

/** The checkout's status, in the order that decides it: recovered wins. */
export function checkoutStatus(checkout: AbandonedCheckout): 'recovered' | 'ready' | 'no-phone' {
  if (checkout.completed_at) return 'recovered'
  return checkout.phone.trim() ? 'ready' : 'no-phone'
}
