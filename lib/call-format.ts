import type { CallLog } from '@/lib/validators/call-logs'

/**
 * Plain formatting for Sarvam calls. Kept out of the agent components so a
 * server component can call them: a function exported from a 'use client'
 * file is a client reference on the server, and calling it throws.
 */

/** mm:ss. A call is seconds-to-minutes; anything longer is another problem. */
export function duration(seconds: number): string {
  const whole = Math.round(seconds)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

/** Human form of Sarvam's SCREAMING_SNAKE outcomes. */
export function readable(value: string): string {
  if (!value || value.startsWith('NO_')) return '—'
  return value.toLowerCase().replaceAll('_', ' ')
}

/**
 * Whether a call has a transcript and a recording to fetch.
 *
 * Only a connected call does. An unanswered one also carries an id that is
 * not in Sarvam's "date/identifier" form, and asking for its transcript gets
 * a 400 - so the shape is checked as well as the flag.
 */
export function hasConversation(call: CallLog): boolean {
  return call.connected && call.interaction_id.includes('/')
}

/** Sarvam sends "2026-10-07T07:49:48" with no zone; it is UTC. */
export function callTime(raw: string): string {
  const parsed = new Date(raw.endsWith('Z') ? raw : `${raw}Z`)
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
