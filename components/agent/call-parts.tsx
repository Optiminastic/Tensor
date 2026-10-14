'use client'

import type { JSX } from 'react'

import { cn } from '@/lib/utils'
import type { CallLog, TranscriptTurn } from '@/lib/validators/call-logs'

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

interface TranscriptViewProps {
  loading: boolean
  error: string | null
  turns: TranscriptTurn[] | null
}

export function TranscriptView({ loading, error, turns }: TranscriptViewProps): JSX.Element {
  if (loading) return <p className="text-muted-foreground text-sm">Reading the transcript…</p>
  if (error) {
    return (
      <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
        {error}
      </p>
    )
  }
  if (!turns || turns.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No transcript for this call. One nobody answered has nothing to transcribe.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <Marker label="Conversation initiated" />
      {turns.map(turn => {
        const agent = turn.role === 'assistant'
        return (
          <div key={turn.turn} className={cn('flex', agent ? 'justify-start' : 'justify-end')}>
            <div
              className={cn(
                'max-w-[85%] text-sm text-pretty',
                // The agent's lines are unbubbled and the customer's are
                // bubbled, which is the asymmetry a messaging app uses for
                // "them" and "you". Two bubbles facing each other reads as two
                // strangers; one bubble reads as a reply.
                agent
                  ? 'text-foreground py-1'
                  : 'bg-surface-muted text-foreground rounded-xl rounded-br-sm px-3.5 py-2.5',
              )}
            >
              <span className="text-subtle-foreground mb-0.5 block text-[11px] font-medium">
                {agent ? 'Riya' : 'Customer'}
              </span>
              {turn.content}
            </div>
          </div>
        )
      })}
      <Marker label="Conversation ended" />
    </div>
  )
}

/**
 * The pills that bracket the conversation.
 *
 * They say the transcript is COMPLETE - that this is the whole call and not
 * the part that fitted. Without them a short exchange reads as a fragment
 * somebody truncated.
 */
function Marker({ label }: { label: string }): JSX.Element {
  return (
    <div className="flex justify-center">
      <span className="border-border/70 text-subtle-foreground rounded-full border px-2.5 py-0.5 text-[11px]">
        {label}
      </span>
    </div>
  )
}

/**
 * How one call went, in Sarvam's words.
 *
 * Shown inside a checkout's drawer, so nothing the checkout already says - the
 * customer, their number, the basket - is repeated here.
 */
export function CallFacts({ call }: { call: CallLog }): JSX.Element {
  const rows: { label: string; value: string }[] = [
    { label: 'Called', value: callTime(call.started_at) },
    { label: 'Outcome', value: readable(call.disposition) },
    { label: 'Connected', value: call.connected ? 'Yes' : 'No' },
    { label: 'Failure', value: readable(call.failure_reason) },
    { label: 'Ended by', value: readable(call.ended_by) },
    { label: 'Length', value: duration(call.duration_seconds) },
    { label: 'Turns', value: String(call.messages) },
    { label: 'Language', value: call.language || '—' },
    {
      label: 'Matched by',
      value:
        call.matched_by === 'attempt'
          ? 'Call id (exact)'
          : call.matched_by === 'phone'
            ? 'Phone number'
            : '—',
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      {call.summary ? (
        <section>
          <h3 className="text-subtle-foreground mb-1.5 text-xs font-medium">
            The agent&apos;s own summary
          </h3>
          <p className="text-foreground text-sm text-pretty">{call.summary}</p>
        </section>
      ) : null}

      <dl className="divide-border/70 divide-y">
        {rows.map(row => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 py-2">
            <dt className="text-muted-foreground text-sm">{row.label}</dt>
            <dd className="text-foreground text-sm">{row.value}</dd>
          </div>
        ))}
      </dl>

      <p className="text-subtle-foreground font-mono text-[11px] break-all">
        {call.interaction_id}
      </p>
    </div>
  )
}
