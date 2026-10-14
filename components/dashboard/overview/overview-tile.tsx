import type { JSX, ReactNode } from 'react'

import { cn } from '@/lib/utils'

type TileTone = 'surface' | 'paper' | 'lime' | 'ink'

interface OverviewTileProps {
  tone?: TileTone
  /** Accessible name for the region. */
  label: string
  children: ReactNode
  className?: string
}

const TONES: Record<TileTone, string> = {
  surface: 'bg-surface text-foreground ring-1 ring-border',
  paper: 'bg-surface-muted text-foreground',
  lime: 'bg-landing-lime text-landing-ink',
  ink: 'bg-landing-ink text-white dark:ring-1 dark:ring-border',
}

/** One rounded bento tile, in the landing page's palette. */
export function OverviewTile({
  tone = 'surface',
  label,
  children,
  className,
}: OverviewTileProps): JSX.Element {
  return (
    <section
      aria-label={label}
      className={cn('flex flex-col gap-4 rounded-3xl p-6', TONES[tone], className)}
    >
      {children}
    </section>
  )
}
