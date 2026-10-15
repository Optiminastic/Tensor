'use client'

import { type JSX, useEffect, useState } from 'react'

interface WindowCountdownProps {
  /** ISO-8601 instant the customer's window closes. */
  endsAt: string
}

/**
 * How long the customer still has to change their mind.
 *
 * SHOWN RATHER THAN WAITED OUT. A job whose window is open used to be absent
 * from the design queue entirely, on the reasoning that anything modelled from
 * it could still move - which is true, and is a reason to say so rather than
 * to make the work invisible behind a timer nobody can see. The designer sees
 * it coming and knows exactly when it is theirs.
 *
 * Ticks client-side from an absolute instant, not from a duration counted
 * down: a tab left open for an hour would otherwise report time the customer
 * no longer has.
 */
export function WindowCountdown({ endsAt }: WindowCountdownProps): JSX.Element | null {
  const [left, setLeft] = useState(() => secondsUntil(endsAt))

  useEffect(() => {
    setLeft(secondsUntil(endsAt))
    const tick = setInterval(() => setLeft(secondsUntil(endsAt)), 1000)
    return () => clearInterval(tick)
  }, [endsAt])

  if (left <= 0) {
    // The row's own data still says the window is open; the server has simply
    // not swept yet. Saying "closing" is honest about both.
    return <span className="text-subtle-foreground shrink-0 text-[11px]">window closing</span>
  }

  const minutes = Math.floor(left / 60)
  const seconds = left % 60
  return (
    <span className="bg-warning-subtle text-warning shrink-0 rounded-full px-2 py-0.5 text-[11px]">
      customer has{' '}
      <span className="font-mono tabular-nums">
        {minutes}:{String(seconds).padStart(2, '0')}
      </span>
    </span>
  )
}

function secondsUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now()
  return Number.isFinite(ms) ? Math.max(0, Math.floor(ms / 1000)) : 0
}
