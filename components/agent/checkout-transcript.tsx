'use client'

import type { JSX } from 'react'

import { TranscriptView } from '@/components/agent/call-parts'
import { Tabs } from '@/components/ui/tabs'
import { useTranscript } from '@/hooks/use-transcript'
import { callTime, hasConversation, readable } from '@/lib/call-format'
import type { CallLog } from '@/lib/validators/call-logs'

interface CheckoutTranscriptProps {
  brand: string
  /** Newest first. */
  calls: CallLog[]
  selection: { index: number; onSelect: (index: number) => void; error: string | null }
}

/**
 * The call, as it was said. The recording plays from the drawer's foot, so it
 * stays in reach however far down the conversation the reader has scrolled.
 *
 * A checkout the agent rang more than once gets a picker, newest first: the
 * second call is usually the one somebody is asking about, and it is the one
 * that opens.
 */
export function CheckoutTranscript({
  brand,
  calls,
  selection,
}: CheckoutTranscriptProps): JSX.Element {
  const call = calls[selection.index]
  const spoken = call !== undefined && hasConversation(call)
  // Not asked for at all when there was no conversation: Sarvam refuses the
  // id of a call nobody answered, and its refusal is not news to anyone.
  const transcript = useTranscript(brand, spoken ? call.interaction_id : '')

  if (selection.error) {
    return (
      <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
        {selection.error}
      </p>
    )
  }
  if (!call) {
    return (
      <p className="text-muted-foreground text-sm">
        The agent has not called this customer, so there is no conversation to show.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {calls.length > 1 ? (
        <div className="overflow-x-auto">
          <Tabs
            tabs={calls.map((c, index) => ({
              value: String(index),
              label: callTime(c.started_at),
            }))}
            value={String(selection.index)}
            onValueChange={value => selection.onSelect(Number(value))}
            label="Which call to read"
          />
        </div>
      ) : null}
      {spoken ? (
        <TranscriptView
          loading={transcript.loading}
          error={transcript.error}
          turns={transcript.turns}
        />
      ) : (
        <p className="text-muted-foreground text-sm text-pretty">
          This call did not connect
          {readable(call.failure_reason) !== '—' ? ` (${readable(call.failure_reason)})` : ''}, so
          there is no conversation or recording.
        </p>
      )}
    </div>
  )
}
