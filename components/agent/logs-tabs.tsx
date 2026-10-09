'use client'

import { type JSX, useState } from 'react'

import { CallLogsTable } from '@/components/agent/call-logs-table'
import { MessageLogsTable } from '@/components/agent/message-logs-table'
import { Tabs } from '@/components/ui/tabs'
import type { CallLog } from '@/lib/validators/call-logs'
import type { MessageLog } from '@/lib/validators/message-logs'

interface LogsTabsProps {
  brand: string
  calls: CallLog[]
  callsError: string | null
  messages: MessageLog[]
  messagesError: string | null
}

type View = 'calls' | 'messages'

/**
 * The two halves of what the win-back agent did, side by side.
 *
 * Tabs rather than two pages, because the question somebody arrives with is
 * "what did we do about this cart", and the answer is split across a call and
 * a message that fired from the same sweep at the same moment. Two routes
 * would mean looking in two places to answer one question.
 *
 * EACH HALF FAILS ON ITS OWN. The call log reads Sarvam's analytics API and
 * the message log reads Tensor's own table, so Sarvam being unreachable must
 * not blank the messages - which is exactly what a single shared error state
 * would do.
 */
export function LogsTabs({
  brand,
  calls,
  callsError,
  messages,
  messagesError,
}: LogsTabsProps): JSX.Element {
  const [view, setView] = useState<View>('calls')

  return (
    <>
      <Tabs
        tabs={[
          { value: 'calls', label: 'Call logs', count: calls.length },
          { value: 'messages', label: 'Message logs', count: messages.length },
        ]}
        value={view}
        onValueChange={next => setView(next as View)}
        label="Which log to read"
      />

      <div role="tabpanel" id={`panel-${view}`} aria-labelledby={`tab-${view}`}>
        {view === 'calls' ? (
          <Panel
            error={callsError}
            empty={calls.length === 0}
            emptyText="No calls in the last 30 days. The agent places one when an abandoned checkout has been quiet long enough."
          >
            <CallLogsTable brand={brand} logs={calls} />
          </Panel>
        ) : (
          <Panel
            error={messagesError}
            empty={messages.length === 0}
            emptyText="No win-back messages yet. One goes out ten minutes after a checkout is abandoned, once WhatsApp is switched on."
          >
            <MessageLogsTable logs={messages} />
          </Panel>
        )}
      </div>
    </>
  )
}

interface PanelProps {
  error: string | null
  empty: boolean
  emptyText: string
  children: React.ReactNode
}

function Panel({ error, empty, emptyText, children }: PanelProps): JSX.Element {
  if (error) {
    return (
      <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
        {error}
      </p>
    )
  }
  if (empty) {
    return (
      <p className="text-muted-foreground rounded-md border border-dashed px-4 py-8 text-center text-sm text-pretty">
        {emptyText}
      </p>
    )
  }
  return <>{children}</>
}
