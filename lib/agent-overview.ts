import { callCost, phoneNumberCost } from '@/lib/agent-costs'
import { callMillis } from '@/lib/checkout-format'
import type { AbandonedCheckout } from '@/lib/validators/abandoned-checkouts'
import type { CallLog } from '@/lib/validators/call-logs'
import type { MessageLog } from '@/lib/validators/message-logs'

/**
 * The Agent overview's numbers, computed from the same three lists the
 * Abandoned Checkout page reads: Shopify's checkouts, Sarvam's calls and
 * Tensor's message ledger. Pure - no fetching, no clock but the one passed in -
 * so every figure on the page can be checked by hand.
 */

/**
 * When the agent went live: the moment checkout #66900099137749 was
 * abandoned (12 Oct 2026, 18:09 IST). Every call and message before it was a
 * test, so nothing earlier is counted - and neither is later activity about a
 * checkout abandoned before it, which was a test cart being rung again.
 */
export const AGENT_LIVE_SINCE = Date.parse('2026-10-12T12:39:32Z')

export interface OverviewInput {
  checkouts: AbandonedCheckout[]
  calls: CallLog[]
  messages: MessageLog[]
  /** The period picked, in ms; clipped below to go-live and to now. */
  range: { from: number; to: number }
  now: number
}

export interface Funnel {
  abandoned: number
  contacted: number
  recovered: number
  /** Recovered AFTER the agent reached out - what the agent can claim. */
  recoveredAfterContact: number
  recoveredValue: number
  recoveredAfterContactValue: number
}

export interface CallStats {
  placed: number
  connected: number
  /** Over connected calls only: an unanswered call has no length. */
  averageSeconds: number
  totalMinutes: number
  callCost: number
  numberCost: number
  totalCost: number
  /** Null when nothing was recovered after contact - a cost per zero is not a number. */
  costPerRecovery: number | null
}

export interface MessageStats {
  sent: number
  failed: number
  pending: number
}

export interface DailyPoint {
  /** "13 Oct" */
  label: string
  calls: number
  messages: number
  recoveries: number
}

export interface RecentCall {
  call: CallLog
  cost: number
}

export interface AgentOverview {
  funnel: Funnel
  calls: CallStats
  messages: MessageStats
  daily: DailyPoint[]
  recent: RecentCall[]
  currency: string
  /** Where counting actually starts: the period's start, or go-live if later. */
  countingFrom: number
  /** Where it ends: the period's end, or now if sooner. */
  countingTo: number
}

const DAY = 86_400_000
/** A bar per day stops reading as bars past a quarter; "All time" is capped here. */
const MAX_DAYS = 92
const ZONE = 'Asia/Kolkata'

/** The store's own day, so "today" turns over at Indian midnight, not UTC's. */
function dayKey(ms: number): string {
  return new Date(ms).toLocaleDateString('en-CA', { timeZone: ZONE })
}

function messageMillis(message: MessageLog): number {
  return Date.parse(message.sent_at || message.created_at)
}

export function buildAgentOverview(input: OverviewInput): AgentOverview {
  const start = Math.max(input.range.from, AGENT_LIVE_SINCE)
  const end = Math.min(input.range.to, input.now)
  const within = (at: number): boolean => at >= start && at <= end
  const live = liveActivity(input)
  const calls = live.calls.filter(c => within(callMillis(c)))
  const messages = live.messages.filter(m => within(messageMillis(m)))
  const checkouts = input.checkouts.filter(c => within(Date.parse(c.created_at)))
  // The number's rent for the days actually counted, not the whole period.
  const countedDays = Math.max(0, (end - start) / DAY)

  const funnel = buildFunnel(checkouts, live.calls, live.messages)
  return {
    funnel,
    calls: buildCallStats({
      calls,
      days: countedDays,
      recoveries: funnel.recoveredAfterContact,
    }),
    messages: {
      sent: messages.filter(m => m.status === 'sent').length,
      failed: messages.filter(m => m.status === 'failed').length,
      pending: messages.filter(m => m.status === 'pending').length,
    },
    daily: buildDaily({
      calls,
      messages,
      checkouts: input.checkouts.filter(c => Date.parse(c.created_at) >= AGENT_LIVE_SINCE),
      start,
      end,
    }),
    recent: [...calls]
      .sort((a, b) => callMillis(b) - callMillis(a))
      .slice(0, 10)
      .map(call => ({ call, cost: callCost(call) })),
    currency: input.checkouts[0]?.currency ?? 'INR',
    countingFrom: start,
    countingTo: end,
  }
}

/**
 * The agent at work, without the testing: console calls, anything before
 * go-live, and anything about a checkout abandoned before go-live.
 */
function liveActivity(input: OverviewInput): { calls: CallLog[]; messages: MessageLog[] } {
  const testCarts = new Set(
    input.checkouts.filter(c => Date.parse(c.created_at) < AGENT_LIVE_SINCE).map(c => c.id),
  )
  const isLive = (checkoutId: string, at: number): boolean =>
    at >= AGENT_LIVE_SINCE && !testCarts.has(checkoutId)
  return {
    calls: input.calls.filter(c => !c.from_console && isLive(c.checkout_id, callMillis(c))),
    messages: input.messages.filter(m => isLive(m.checkout_id, messageMillis(m))),
  }
}

/** When the agent first reached each checkout, by call or message. */
function firstContact(calls: CallLog[], messages: MessageLog[]): Map<string, number> {
  const first = new Map<string, number>()
  const note = (id: string, at: number): void => {
    if (!id || Number.isNaN(at)) return
    const seen = first.get(id)
    if (seen === undefined || at < seen) first.set(id, at)
  }
  for (const call of calls) if (!call.from_console) note(call.checkout_id, callMillis(call))
  for (const message of messages) {
    if (message.status === 'sent') note(message.checkout_id, messageMillis(message))
  }
  return first
}

/**
 * Abandoned in the period, then reached, then recovered.
 *
 * Contact is looked up across ALL calls and messages, not just the period's: a
 * cart abandoned on the 6th day of a week may have been rung on the 7th.
 */
function buildFunnel(
  checkouts: AbandonedCheckout[],
  calls: CallLog[],
  messages: MessageLog[],
): Funnel {
  const contact = firstContact(calls, messages)
  const funnel: Funnel = {
    abandoned: checkouts.length,
    contacted: 0,
    recovered: 0,
    recoveredAfterContact: 0,
    recoveredValue: 0,
    recoveredAfterContactValue: 0,
  }
  for (const checkout of checkouts) {
    const reached = contact.get(checkout.id)
    if (reached !== undefined) funnel.contacted += 1
    if (!checkout.completed_at) continue
    const value = Number(checkout.total_amount) || 0
    funnel.recovered += 1
    funnel.recoveredValue += value
    // Recovered before anyone reached out is the customer coming back on
    // their own, and claiming it would flatter the agent.
    if (reached !== undefined && reached < Date.parse(checkout.completed_at)) {
      funnel.recoveredAfterContact += 1
      funnel.recoveredAfterContactValue += value
    }
  }
  return funnel
}

interface CallStatsInput {
  calls: CallLog[]
  /** Days actually counted, for the number's rent; may be fractional. */
  days: number
  recoveries: number
}

function buildCallStats({ calls, days, recoveries }: CallStatsInput): CallStats {
  const connected = calls.filter(c => c.connected)
  const seconds = connected.reduce((sum, c) => sum + Math.max(0, c.duration_seconds), 0)
  const cost = calls.reduce((sum, c) => sum + callCost(c), 0)
  const numberCost = phoneNumberCost(days)
  const totalCost = cost + numberCost
  return {
    placed: calls.length,
    connected: connected.length,
    averageSeconds: connected.length > 0 ? seconds / connected.length : 0,
    totalMinutes: seconds / 60,
    callCost: cost,
    numberCost,
    totalCost,
    costPerRecovery: recoveries > 0 ? totalCost / recoveries : null,
  }
}

interface DailyInput {
  calls: CallLog[]
  messages: MessageLog[]
  /** All checkouts: a recovery is dated by when it was paid, not abandoned. */
  checkouts: AbandonedCheckout[]
  start: number
  end: number
}

/** One point per day of the period, empty days included - a gap is data. */
function buildDaily({ calls, messages, checkouts, start, end }: DailyInput): DailyPoint[] {
  const points = new Map<string, DailyPoint>()
  // Stepped by day from the first counted moment, keyed by the store's day, so
  // a period that opens at 18:09 still gets that day's bar. A long period
  // keeps its most recent days.
  const first = Math.max(start, end - (MAX_DAYS - 1) * DAY)
  for (let at = first; dayKey(at) <= dayKey(end); at += DAY) {
    points.set(dayKey(at), {
      label: new Date(at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        timeZone: ZONE,
      }),
      calls: 0,
      messages: 0,
      recoveries: 0,
    })
  }
  for (const call of calls) {
    const point = points.get(dayKey(callMillis(call)))
    if (point) point.calls += 1
  }
  for (const message of messages) {
    const point = points.get(dayKey(messageMillis(message)))
    if (point) point.messages += 1
  }
  for (const checkout of checkouts) {
    if (!checkout.completed_at) continue
    const point = points.get(dayKey(Date.parse(checkout.completed_at)))
    if (point) point.recoveries += 1
  }
  return [...points.values()]
}
