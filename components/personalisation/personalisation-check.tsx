'use client'

import { type JSX, useEffect, useState } from 'react'

import { PersonalisationItemCard } from '@/components/personalisation/personalisation-item-card'
import { Button } from '@/components/ui/button'
import type { PersonalisationLink } from '@/lib/validators/personalisation'

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
      <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 pt-7">
        <header className="flex flex-col gap-1.5">
          <p className="text-subtle-foreground font-mono text-xs tracking-wide">
            {link.order_number}
          </p>
          <h1 className="text-display text-[26px] leading-tight">
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
        <div className="border-border/60 bg-surface/95 fixed inset-x-0 bottom-0 border-t backdrop-blur">
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
  if (confirmed) {
    return (
      <p className="bg-success-subtle text-success rounded-xl px-4 py-3 text-sm text-pretty">
        Confirmed — thank you. This is going into production exactly as shown.
      </p>
    )
  }
  if (secondsLeft <= 0) {
    return (
      <p className="bg-surface-muted text-muted-foreground rounded-xl px-4 py-3 text-sm text-pretty">
        This window has closed and your order is being made as shown. Message the shop if something
        still needs changing.
      </p>
    )
  }

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  // Under two minutes it stops being background information and becomes the
  // thing to act on.
  const urgent = secondsLeft < 120

  return (
    <p
      className={
        urgent
          ? 'bg-warning-subtle text-warning rounded-xl px-4 py-2.5 text-sm'
          : 'bg-surface-muted text-muted-foreground rounded-xl px-4 py-2.5 text-sm'
      }
    >
      You can make changes for{' '}
      <span className="font-mono font-medium tabular-nums">
        {minutes}:{String(seconds).padStart(2, '0')}
      </span>
    </p>
  )
}
