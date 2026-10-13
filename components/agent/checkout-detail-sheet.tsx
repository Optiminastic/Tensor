'use client'

import { type JSX, useState } from 'react'

import type { ActivityErrors } from '@/components/agent/agent-activity-summary'
import { duration } from '@/components/agent/call-parts'
import { CheckoutMessages } from '@/components/agent/checkout-messages'
import { CheckoutOverview } from '@/components/agent/checkout-overview'
import { CheckoutStatusBadge } from '@/components/agent/checkout-status-badge'
import { CheckoutTranscript } from '@/components/agent/checkout-transcript'
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
import type { CheckoutActivity } from '@/lib/checkout-format'
import type { AbandonedCheckout } from '@/lib/validators/abandoned-checkouts'
import type { CallLog } from '@/lib/validators/call-logs'
import type { MessageTemplate } from '@/lib/validators/message-logs'

/** What every checkout's drawer shares: how the agent data loaded, and setup. */
export interface DrawerContext {
  brand: string
  errors: ActivityErrors
  /** The approved copy, for messages sent before Tensor recorded the words. */
  template: MessageTemplate | null
  /** False when the backend has no Sarvam credentials; the Call button goes flat. */
  callingEnabled: boolean
}

interface CheckoutDetailSheetProps {
  /** The last checkout opened. Kept while closing so the panel slides out whole. */
  checkout: AbandonedCheckout | null
  open: boolean
  activity: CheckoutActivity
  context: DrawerContext
  onClose: () => void
}

/**
 * One abandoned checkout, in full: Shopify's record of it, and everything the
 * win-back agent did about it.
 *
 * This replaced a separate Logs page. The question is always "what happened
 * with THIS cart", and its answer was split across two pages that had to be
 * matched by eye. Here the calls and messages hang off the checkout they were
 * about.
 */
export function CheckoutDetailSheet({
  checkout,
  open,
  activity,
  context,
  onClose,
}: CheckoutDetailSheetProps): JSX.Element {
  return (
    <Sheet open={open && checkout !== null} onOpenChange={next => !next && onClose()}>
      <SheetContent side="right" className="flex max-w-xl flex-col">
        {checkout ? (
          // Keyed on the checkout, so its tab and chosen call start fresh for
          // each one rather than leaking from the last.
          <DrawerContents
            key={checkout.id}
            checkout={checkout}
            activity={activity}
            context={context}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

type View = 'overview' | 'transcript' | 'messages'

interface DrawerContentsProps {
  checkout: AbandonedCheckout
  activity: CheckoutActivity
  context: DrawerContext
}

function DrawerContents({ checkout, activity, context }: DrawerContentsProps): JSX.Element {
  const [view, setView] = useState<View>('overview')
  const [callIndex, setCallIndex] = useState(0)
  const call = activity.calls[callIndex]

  return (
    <>
      <SheetHeader>
        <SheetTitle>{checkout.customer_name || 'Abandoned checkout'}</SheetTitle>
        <SheetDescription asChild>
          <div className="flex flex-wrap items-center gap-2">
            <CopyableId value={checkout.name} label={`checkout ${checkout.name}`} />
            <CheckoutStatusBadge checkout={checkout} />
          </div>
        </SheetDescription>
      </SheetHeader>

      <div className="px-6 pb-3">
        <Tabs
          tabs={[
            { value: 'overview', label: 'Overview' },
            { value: 'transcript', label: 'Transcript', count: activity.calls.length },
            { value: 'messages', label: 'Message log', count: activity.messages.length },
          ]}
          value={view}
          onValueChange={value => setView(value as View)}
          label="Checkout detail view"
        />
      </div>

      <SheetBody className="flex-1" role="tabpanel" aria-labelledby={`tab-${view}`}>
        {view === 'overview' ? (
          <CheckoutOverview
            checkout={checkout}
            activity={activity}
            options={{ errors: context.errors, callingEnabled: context.callingEnabled }}
          />
        ) : view === 'transcript' ? (
          <CheckoutTranscript
            brand={context.brand}
            calls={activity.calls}
            selection={{ index: callIndex, onSelect: setCallIndex, error: context.errors.calls }}
          />
        ) : (
          <CheckoutMessages
            messages={activity.messages}
            template={context.template}
            error={context.errors.messages}
          />
        )}
      </SheetBody>

      {view === 'transcript' && call ? <RecordingPlayer brand={context.brand} call={call} /> : null}
    </>
  )
}

/**
 * Pinned to the drawer's foot, OUTSIDE the scrolling body. A transcript is
 * long and the thing you reach for while reading it is the audio - scrolling
 * back to the top to pause would be absurd.
 */
function RecordingPlayer({ brand, call }: { brand: string; call: CallLog }): JSX.Element {
  return (
    <div className="border-border/70 bg-surface-muted/40 border-t px-6 py-4">
      <audio
        // Keyed so choosing another call loads its recording, not the last one's.
        key={call.interaction_id}
        controls
        preload="none"
        className="w-full"
        // Through Tensor, not Sarvam. The audio_url on a call points at
        // indus.sarvam.ai, which authenticates with a browser session and
        // answers 403 to anything else. The backend holds the API key and
        // streams the bytes, so the key never reaches this page.
        src={`/api/call-recording?brand=${encodeURIComponent(brand)}&interaction=${encodeURIComponent(call.interaction_id)}`}
      >
        Your browser cannot play this recording.
      </audio>
      <p className="text-subtle-foreground mt-2 text-xs">
        {duration(call.duration_seconds)} · {call.messages} turns · {call.language}
      </p>
    </div>
  )
}
