'use client'

import { type JSX, useEffect, useState } from 'react'

import { PersonalisationItemCard } from '@/components/personalisation/personalisation-item-card'
import { Button } from '@/components/ui/button'
import { Tag } from '@/components/ui/tag'
import { cn } from '@/lib/utils'
import type { PersonalisationLink } from '@/lib/validators/personalisation'

/** The window the shop gives a customer, in seconds - PERSONALISATION_LINK_MINUTES. */
const WINDOW_SECONDS = 30 * 60

interface PersonalisationCheckProps {
  token: string
  link: PersonalisationLink
}

/**
 * The customer's check on their own order.
 *
 * BUILT FOR A PHONE HELD IN ONE HAND, because that is where a WhatsApp link is
 * opened. One column at every width, nothing smaller than 44px to tap, and the
 * confirm button pinned to the bottom of the screen - an order of six planks
 * puts it three screens down otherwise, and somebody who has read the first
 * one should not have to scroll past the rest to say yes.
 */
export function PersonalisationCheck({ token, link }: PersonalisationCheckProps): JSX.Element {
  const [secondsLeft, setSecondsLeft] = useState(link.seconds_left)
  const [confirmed, setConfirmed] = useState(link.confirmed)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const tick = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(tick)
  }, [secondsLeft])

  async function confirm(): Promise<void> {
    setSending(true)
    try {
      const response = await fetch(`/api/p/${encodeURIComponent(token)}/confirm`, {
        method: 'POST',
      })
      if (response.ok) setConfirmed(true)
    } finally {
      setSending(false)
    }
  }

  const open = secondsLeft > 0 && !confirmed
  const firstName = link.customer_name.trim().split(' ')[0]

  return (
    <div className="min-h-dvh pb-28">
      <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 pt-7">
        {/* The shop's own mark, so a link arriving in WhatsApp from a number
            the customer has never saved still looks like the shop they
            bought from. */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-landing-ink bg-landing-lime inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-tight">
            The 3D Printing Store
          </span>
          <span className="text-subtle-foreground font-mono text-xs tracking-wide">
            {link.order_number}
          </span>
        </div>

        <header className="flex flex-col gap-2">
          <h1 className="text-display text-[30px] leading-[1.1]">
            {firstName ? `Thanks, ${firstName}` : 'Thanks for your order'}
          </h1>
          <p className="text-muted-foreground text-pretty">
            Check the spelling below — this is exactly how it will be made.
          </p>
        </header>

        <Status secondsLeft={secondsLeft} confirmed={confirmed} />

        <div className="flex flex-col gap-4">
          {link.items.map(item => (
            <PersonalisationItemCard
              key={item.job_id}
              token={token}
              item={item}
              colours={link.colours}
              editable={open}
            />
          ))}
        </div>
      </main>

      {open ? (
        <div className="border-border/70 bg-surface/95 fixed inset-x-0 bottom-0 border-t backdrop-blur">
          {/* safe-area-inset so the button clears the home indicator on a
              modern phone rather than sitting under it. */}
          <div className="mx-auto w-full max-w-md px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Button
              onClick={() => void confirm()}
              disabled={sending}
              className="h-12 w-full text-base"
            >
              {sending ? 'Confirming…' : 'Looks right — confirm'}
            </Button>
            <p className="text-subtle-foreground mt-1.5 text-center text-xs">
              Do nothing and we will make it exactly as shown.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

interface StatusProps {
  secondsLeft: number
  confirmed: boolean
}

function Status({ secondsLeft, confirmed }: StatusProps): JSX.Element {
  // The same Tag the rest of the product uses for a state, so the one page a
  // customer sees is not the one place with a shape of its own. The sentence
  // sits under it rather than inside: a tag is a label, and three lines of
  // explanation in a pill reads as neither.
  if (confirmed) {
    return (
      <div className="flex flex-col gap-2">
        <Tag tone="success">Confirmed</Tag>
        <p className="text-muted-foreground text-sm text-pretty">
          Thank you — this is going into production exactly as shown.
        </p>
      </div>
    )
  }
  if (secondsLeft <= 0) {
    return (
      <div className="flex flex-col gap-2">
        <Tag tone="muted">Window closed</Tag>
        <p className="text-muted-foreground text-sm text-pretty">
          Your order is being made as shown. Message the shop if something still needs changing.
        </p>
      </div>
    )
  }

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  // Under two minutes it stops being background information and becomes the
  // thing to act on.
  const urgent = secondsLeft < 120
  // The bar is the window, not the session: a customer opening the link
  // twenty minutes in should see a bar that is already two thirds gone,
  // because it is. Guarded against a longer window than the usual thirty
  // minutes so the bar can never start over-full.
  const total = Math.max(WINDOW_SECONDS, secondsLeft)
  const remaining = Math.max(0, Math.min(100, (secondsLeft / total) * 100))

  return (
    <div
      className={cn(
        'flex flex-col gap-2.5 rounded-2xl border px-4 py-3.5',
        urgent ? 'border-warning/40 bg-warning-subtle' : 'border-border/70 bg-surface',
      )}
      // Announced on the minute rather than every tick: a screen reader
      // reciting a new number each second is unusable.
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span
          className={cn(
            'font-mono text-[32px] leading-none font-semibold tabular-nums',
            urgent ? 'text-warning' : 'text-foreground',
          )}
        >
          {minutes}:{String(seconds).padStart(2, '0')}
        </span>
        <span className="text-muted-foreground text-sm">
          {urgent ? 'left — changes close soon' : 'left to make changes'}
        </span>
      </div>
      {/* The clock as a shape as well as a number. Somebody glancing at the
          page should know roughly how long they have without reading it. */}
      <div className="bg-surface-muted h-1.5 w-full overflow-hidden rounded-full">
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-1000 ease-linear',
            urgent ? 'bg-warning' : 'bg-accent',
          )}
          style={{ width: `${remaining}%` }}
        />
      </div>
    </div>
  )
}
