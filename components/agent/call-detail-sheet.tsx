'use client'

import { type JSX, useEffect, useState } from 'react'

import { loadTranscriptAction } from '@/app/dashboard/[brand]/agent/call-logs/actions'
import { Badge } from '@/components/ui/badge'
import { CopyableId } from '@/components/ui/copyable-id'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { CallLog, TranscriptTurn } from '@/lib/validators/call-logs'

interface CallDetailSheetProps {
  brand: string
  /** The call to show, or null when the panel is closed. */
  call: CallLog | null
  onClose: () => void
}

type View = 'transcript' | 'overview'

/** mm:ss. A call is seconds-to-minutes; anything longer is another problem. */
function duration(seconds: number): string {
  const whole = Math.round(seconds)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

/** Human form of Sarvam's SCREAMING_SNAKE outcomes. */
function readable(value: string): string {
  if (!value || value.startsWith('NO_')) return '—'
  return value.toLowerCase().replaceAll('_', ' ')
}

/**
 * One call, in full: what was said, and how it went.
 *
 * A PANEL, not an expanding row. A transcript is a record to read, and reading
 * it inside the table pushes every other row down the page - so you lose your
 * place in the list to look at one line of it. The panel leaves the list where
 * it was.
 *
 * The conversation is laid out as a conversation: the agent on the left, the
 * customer on the right. A transcript rendered as a label-and-value list reads
 * like data about a call rather than the call itself, and the thing an
 * operator is doing here is listening to how it went.
 */
export function CallDetailSheet({ brand, call, onClose }: CallDetailSheetProps): JSX.Element {
  const [view, setView] = useState<View>('transcript')
  const [turns, setTurns] = useState<TranscriptTurn[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const interactionId = call?.interaction_id ?? ''

  useEffect(() => {
    if (!interactionId) {
      setTurns(null)
      return
    }
    let live = true
    setLoading(true)
    setError(null)
    setTurns(null)
    void loadTranscriptAction(brand, interactionId).then(result => {
      if (!live) return
      setLoading(false)
      if (!result.ok || !result.data) {
        setError(result.error ?? 'Could not read that transcript.')
        return
      }
      setTurns(result.data.turns)
    })
    return () => {
      live = false
    }
  }, [brand, interactionId])

  return (
    <Sheet open={call !== null} onOpenChange={open => !open && onClose()}>
      <SheetContent side="right" className="flex max-w-xl flex-col">
        <SheetHeader>
          <SheetTitle>Call details</SheetTitle>
          <SheetDescription asChild>
            <div className="flex flex-wrap items-center gap-2">
              {call?.checkout_name ? (
                <CopyableId value={call.checkout_name} label="checkout" />
              ) : (
                <span className="text-subtle-foreground text-sm">Not a checkout call</span>
              )}
              {call?.from_console ? <Badge tone="neutral">Console test</Badge> : null}
            </div>
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pb-3">
          <Tabs
            tabs={[
              { value: 'transcript', label: 'Transcript' },
              { value: 'overview', label: 'Overview' },
            ]}
            value={view}
            onValueChange={value => setView(value as View)}
            label="Call detail view"
          />
        </div>

        <SheetBody className="flex-1">
          {view === 'transcript' ? (
            <TranscriptView loading={loading} error={error} turns={turns} />
          ) : (
            <OverviewView call={call} />
          )}
        </SheetBody>

        {/*
          The player sits OUTSIDE the scrolling body, pinned to the foot. A
          transcript is long and the thing you reach for while reading it is
          the audio - scrolling back to the top to pause would be absurd.
        */}
        {call && interactionId ? (
          <div className="border-border/70 bg-surface-muted/40 border-t px-6 py-4">
            <audio
              controls
              preload="none"
              className="w-full"
              // Through Tensor, not Sarvam. The audio_url on a call points at
              // indus.sarvam.ai, which authenticates with a browser session
              // and answers 403 to anything else. The backend holds the API
              // key and streams the bytes, so the key never reaches this page.
              src={`/api/call-recording?brand=${encodeURIComponent(brand)}&interaction=${encodeURIComponent(interactionId)}`}
            >
              Your browser cannot play this recording.
            </audio>
            <p className="text-subtle-foreground mt-2 text-xs">
              {duration(call.duration_seconds)} · {call.messages} turns · {call.language}
            </p>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

interface TranscriptViewProps {
  loading: boolean
  error: string | null
  turns: TranscriptTurn[] | null
}

function TranscriptView({ loading, error, turns }: TranscriptViewProps): JSX.Element {
  if (loading) return <p className="text-muted-foreground text-sm">Reading the transcript…</p>
  if (error) {
    return (
      <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
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

function OverviewView({ call }: { call: CallLog | null }): JSX.Element {
  if (!call) return <p className="text-muted-foreground text-sm">Nothing to show.</p>

  const rows: { label: string; value: string }[] = [
    { label: 'Outcome', value: readable(call.disposition) },
    { label: 'Connected', value: call.connected ? 'Yes' : 'No' },
    { label: 'Failure', value: readable(call.failure_reason) },
    { label: 'Ended by', value: readable(call.ended_by) },
    { label: 'Length', value: duration(call.duration_seconds) },
    { label: 'Turns', value: String(call.messages) },
    { label: 'Language', value: call.language || '—' },
    { label: 'Contact', value: call.phone || '—' },
    { label: 'Customer', value: call.customer_name || '—' },
    { label: 'Checkout', value: call.checkout_name || 'Not a checkout call' },
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
