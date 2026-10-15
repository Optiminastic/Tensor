import type { JSX } from 'react'

import { PillLink } from '@/components/landing/pill-link'

interface OverviewHeaderProps {
  brandLabel: string
  brandHref: string
  firstName: string | null
}

/** The shop's day: India time, because that is where the floor is. */
function today(): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date())
}

/** A greeting, the brand and day, and the two places people go next. */
export function OverviewHeader({
  brandLabel,
  brandHref,
  firstName,
}: OverviewHeaderProps): JSX.Element {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-muted-foreground font-mono text-xs tracking-[0.18em] uppercase">
          {brandLabel} · {today()}
        </p>
        <h1 className="text-4xl font-medium tracking-[-0.04em] sm:text-5xl">
          {firstName ? `Hi, ${firstName}` : 'Overview'}
        </h1>
      </div>
      <div className="flex flex-wrap gap-3">
        <PillLink href={`${brandHref}/production/orders`} tone="ink">
          View orders
        </PillLink>
        <PillLink href={`${brandHref}/production`} tone="lime" withArrow>
          Production
        </PillLink>
      </div>
    </header>
  )
}
