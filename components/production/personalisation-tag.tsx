'use client'

import { type JSX, useState } from 'react'

import { PERSONALISATION_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { PersonalisationStatus } from '@/components/production/types'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import type { PersonalisationChange } from '@/lib/validators/personalisation-changes'
import {
  fetchPersonalisationChanges,
  fetchPersonalisationLink,
} from '@/services/personalisation-changes.service'

interface PersonalisationTagProps {
  jobId: string
  status: PersonalisationStatus
}

/**
 * How the customer's check stands, and what to do about it.
 *
 * The tag does different work in its two interesting states, because the two
 * questions are different:
 *
 *   Link sent  the window is open - CLICK COPIES the customer's own link, so
 *              whoever takes the phone call can send them back to the page
 *              they are describing.
 *   Changed    the window has closed and something moved - HOVER SHOWS what,
 *              for the person about to make it.
 *
 * Nothing else is interactive. A tag that looks clickable and then says
 * "nothing to copy" is worse than one that plainly is not.
 */
export function PersonalisationTag({ jobId, status }: PersonalisationTagProps): JSX.Element {
  if (status === 'awaiting_customer') {
    return <CopyLinkTag jobId={jobId} status={status} />
  }
  if (status === 'changed') {
    return <ChangesTag jobId={jobId} status={status} />
  }
  return <TonePill {...PERSONALISATION_STATUS_CONFIG[status]} />
}

/**
 * Copies the live link.
 *
 * FETCHED ON CLICK, never with the row. A link is a credential: shipping one
 * for every open window into every page load would put them in the browser of
 * everybody who merely opened the queue, and in whatever logs sit in front of
 * it. This way the only links that leave the server are the ones somebody
 * asked for.
 */
function CopyLinkTag({ jobId, status }: PersonalisationTagProps): JSX.Element {
  const [state, setState] = useState<'idle' | 'copying' | 'copied' | 'gone'>('idle')

  async function copy(): Promise<void> {
    setState('copying')
    try {
      const { url } = await fetchPersonalisationLink(jobId)
      if (!url) {
        // The window closed between the page loading and the click. Said
        // plainly rather than copying nothing and claiming success.
        setState('gone')
        return
      }
      await navigator.clipboard.writeText(url)
      setState('copied')
      setTimeout(() => setState('idle'), 2000)
    } catch {
      setState('gone')
    }
  }

  const label =
    state === 'copied'
      ? 'Link copied'
      : state === 'copying'
        ? 'Copying…'
        : state === 'gone'
          ? 'Window closed'
          : PERSONALISATION_STATUS_CONFIG[status].label

  return (
    <button
      type="button"
      onClick={() => void copy()}
      title="Copy this customer's personalisation link"
      className="cursor-pointer"
    >
      <TonePill
        label={label}
        tone={state === 'copied' ? 'success' : PERSONALISATION_STATUS_CONFIG[status].tone}
      />
    </button>
  )
}

/** Shows what the customer moved, on hover. */
function ChangesTag({ jobId, status }: PersonalisationTagProps): JSX.Element {
  const [changes, setChanges] = useState<PersonalisationChange[] | null>(null)
  const [failed, setFailed] = useState(false)

  function load(open: boolean): void {
    // Once. The values are frozen the moment the window closes, so a second
    // fetch would return the same answer.
    if (!open || changes !== null || failed) return
    void fetchPersonalisationChanges(jobId)
      .then(setChanges)
      .catch(() => setFailed(true))
  }

  return (
    <HoverCard openDelay={120} onOpenChange={load}>
      <HoverCardTrigger asChild>
        {/* A button, not a span: the card has to be reachable from the
            keyboard, and hover alone never is. */}
        <button type="button" className="cursor-help">
          <TonePill {...PERSONALISATION_STATUS_CONFIG[status]} />
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <p className="text-subtle-foreground mb-2 text-[11px] font-medium tracking-wide uppercase">
          What the customer changed
        </p>
        {failed ? (
          <p className="text-muted-foreground text-sm">Could not read the changes.</p>
        ) : changes === null ? (
          <p className="text-muted-foreground text-sm">Reading…</p>
        ) : changes.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing was changed after all.</p>
        ) : (
          <dl className="flex flex-col gap-2">
            {changes.map(change => (
              <div key={change.label} className="flex flex-col gap-0.5">
                <dt className="text-subtle-foreground text-xs">{change.label}</dt>
                <dd className="flex flex-wrap items-center gap-1.5 text-sm">
                  {/* The old value struck through, the new one plain. The
                      person reading this is about to make the new one and
                      needs to see at a glance which is which. */}
                  <span className="text-muted-foreground line-through">{change.from}</span>
                  <span className="text-subtle-foreground">→</span>
                  <span className="text-foreground font-medium">{change.to}</span>
                </dd>
              </div>
            ))}
          </dl>
        )}
      </HoverCardContent>
    </HoverCard>
  )
}
