'use client'

import { Check, Copy } from 'lucide-react'
import { type JSX, useState } from 'react'

import { PERSONALISATION_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { PersonalisationStatus } from '@/components/production/types'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { cn } from '@/lib/utils'
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
  return (
    <span className="flex items-center gap-1.5">
      {status === 'changed' ? (
        <ChangesTag jobId={jobId} status={status} />
      ) : (
        <TonePill {...PERSONALISATION_STATUS_CONFIG[status]} />
      )}
      {/* Its own control, beside the tag rather than inside it. Copying a
          link and reading a status are two different acts, and a tag that
          changed its own label to "Link copied" was briefly lying about the
          job's state to report on a click. */}
      {status === 'awaiting_customer' ? <CopyLinkButton jobId={jobId} /> : null}
    </span>
  )
}

/**
 * Copies the live link.
 *
 * FETCHED ON CLICK, never with the row. A link is a credential: shipping one
 * for every open window into every page load would put them in the browser of
 * everybody who merely opened the queue, and in whatever logs sit in front of
 * it. This way the only links that leave the server are the ones somebody
 * asked for.
 *
 * Shown only while the window is open, which is the only time a link exists -
 * the backend destroys its recoverable copy when the window closes, so on any
 * other row this button could do nothing but apologise.
 */
function CopyLinkButton({ jobId }: { jobId: string }): JSX.Element {
  const [state, setState] = useState<'idle' | 'copying' | 'copied' | 'gone' | 'failed'>('idle')

  async function copy(): Promise<void> {
    setState('copying')
    let url: string
    try {
      url = (await fetchPersonalisationLink(jobId)).url
    } catch {
      setState('failed')
      return
    }
    if (!url) {
      // The window closed between the page loading and the click. Said plainly
      // rather than copying nothing and claiming success.
      setState('gone')
      return
    }
    // THREE OUTCOMES, NOT TWO. "There is no link" and "the clipboard refused"
    // are different things and were being reported with the same sentence -
    // so a browser blocking the write told the floor the customer's window had
    // closed, which it had not.
    if (await writeToClipboard(url)) {
      setState('copied')
      setTimeout(() => setState('idle'), 2000)
      return
    }
    setState('failed')
  }

  const title =
    state === 'copied'
      ? 'Copied'
      : state === 'gone'
        ? 'That window has closed'
        : state === 'failed'
          ? 'Could not copy — try again'
          : "Copy this customer's personalisation link"

  return (
    <button
      type="button"
      onClick={event => {
        // THE ROW NAVIGATES. This button lives inside a table row whose own
        // click opens the job, so without stopping here a copy opens the job
        // page instead - the click reaches the row, the router moves, and the
        // clipboard write is abandoned with the page.
        event.stopPropagation()
        void copy()
      }}
      title={title}
      aria-label={title}
      disabled={state === 'copying'}
      className={cn(
        'text-subtle-foreground hover:text-foreground rounded p-1 transition',
        state === 'copied' && 'text-success',
        (state === 'gone' || state === 'failed') && 'text-danger',
      )}
    >
      {state === 'copied' ? (
        <Check className="size-3.5" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
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
        <button
          type="button"
          className="cursor-help"
          // Same row, same reason: reading what changed should not navigate
          // away from the list you are reading it in.
          onClick={event => event.stopPropagation()}
        >
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

/**
 * Writes to the clipboard, with a fallback for when the API is unavailable.
 *
 * navigator.clipboard needs a secure context, which localhost and https both
 * are - but it is also refused when the browser decides the user gesture has
 * gone stale, and this write happens after a network round trip. The old
 * textarea trick has no such rule, so it covers exactly the case the modern
 * API drops.
 *
 * Returns whether anything was actually copied, so the caller never reports
 * success it did not have.
 */
async function writeToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fall through to the older path rather than giving up.
  }

  try {
    const field = document.createElement('textarea')
    field.value = text
    // Off-screen rather than hidden: a display:none element cannot be
    // selected, and selection is what the fallback copies.
    field.style.position = 'fixed'
    field.style.opacity = '0'
    document.body.appendChild(field)
    field.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(field)
    return copied
  } catch {
    return false
  }
}
