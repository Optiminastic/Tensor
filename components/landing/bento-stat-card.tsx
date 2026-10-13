import type { JSX, ReactNode } from 'react'

import { cn } from '@/lib/utils'

type StatTone = 'paper' | 'lime' | 'ink'

interface BentoStatCardProps {
  tone: StatTone
  label: string
  value: string
  children?: ReactNode
  className?: string
}

const TONES: Record<StatTone, string> = {
  paper: 'bg-landing-paper text-landing-ink',
  lime: 'bg-landing-lime text-landing-ink',
  ink: 'bg-landing-ink text-white',
}

/** A bento tile: a small label, one big figure, and what it means. */
export function BentoStatCard({
  tone,
  label,
  value,
  children,
  className,
}: BentoStatCardProps): JSX.Element {
  return (
    <article className={cn('flex flex-col gap-4 rounded-3xl p-6', TONES[tone], className)}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-5xl font-medium tracking-[-0.04em] tabular-nums">{value}</p>
      {children ? <div className="mt-auto text-sm text-pretty">{children}</div> : null}
    </article>
  )
}
