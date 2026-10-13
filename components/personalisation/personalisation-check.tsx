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
 * Written for a phone held in one hand, because that is where a WhatsApp link
 * is opened. One column, large type, and the thing they came to read - their
 * own names - above the fold rather than below a 3D viewer that is still
 * loading.
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

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-5 py-8">
      <header className="flex flex-col gap-1">
        <p className="text-subtle-foreground font-mono text-xs tracking-wide">
          {link.order_number}
        </p>
        <h1 className="text-display text-2xl">
          {link.customer_name ? `Thanks, ${link.customer_name.split(' ')[0]}` : 'Thanks'}
        </h1>
        <p className="text-muted-foreground text-pretty">
          Here is what we are about to make. Check the spelling — this is exactly how it will be
          engraved.
        </p>
      </header>

      {/* The clock is stated, not just counted down, because a customer who
          opens this ten minutes later needs to know whether it is still
          worth reading. */}
      <Countdown secondsLeft={secondsLeft} confirmed={confirmed} />

      <div className="flex flex-col gap-5">
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

      {open ? (
        <div className="flex flex-col gap-2">
          <Button onClick={() => void confirm()} disabled={sending} className="w-full">
            {sending ? 'Confirming…' : 'Yes, this is right'}
          </Button>
          <p className="text-subtle-foreground text-center text-xs text-pretty">
            If you do nothing we will make it exactly as shown.
          </p>
        </div>
      ) : null}
    </main>
  )
}

interface CountdownProps {
  secondsLeft: number
  confirmed: boolean
}

function Countdown({ secondsLeft, confirmed }: CountdownProps): JSX.Element {
  if (confirmed) {
    return (
      <p className="bg-success-subtle text-success rounded-lg px-4 py-3 text-sm text-pretty">
        Confirmed — thank you. This is going into production as shown.
      </p>
    )
  }
  if (secondsLeft <= 0) {
    return (
      <p className="bg-surface-muted text-muted-foreground rounded-lg px-4 py-3 text-sm text-pretty">
        This window has closed and your order is being made as shown. Message the shop if something
        needs changing.
      </p>
    )
  }

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  return (
    <p className="bg-surface-muted rounded-lg px-4 py-3 text-sm">
      <span className="text-muted-foreground">You can make changes for </span>
      <span className="text-foreground font-mono font-medium tabular-nums">
        {minutes}:{String(seconds).padStart(2, '0')}
      </span>
    </p>
  )
}
