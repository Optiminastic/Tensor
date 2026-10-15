import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import type { JSX } from 'react'

import { OverviewTile } from '@/components/dashboard/overview/overview-tile'
import { TileLabel } from '@/components/dashboard/overview/tile-label'
import type { CountBreakdown } from '@/lib/production/floor-model'
import { cn } from '@/lib/utils'

type CountTone = 'surface' | 'paper' | 'lime'

interface CountTileProps {
  tone: CountTone
  title: string
  counts: CountBreakdown
  link: { href: string; label: string }
}

const DOT: Record<CountBreakdown['parts'][number]['tone'], string> = {
  danger: 'bg-danger',
  warning: 'bg-warning',
  success: 'bg-success',
  muted: 'bg-current opacity-40',
}

/** A count for the range, its breakdown as labelled rows, and where to go next. */
export function CountTile({ tone, title, counts, link }: CountTileProps): JSX.Element {
  return (
    <OverviewTile tone={tone} label={title} className="h-full">
      <div className="flex items-start justify-between gap-3">
        <TileLabel>{title}</TileLabel>
        <Link
          href={link.href}
          aria-label={link.label}
          className="-m-1.5 grid size-8 place-items-center rounded-full transition-colors hover:bg-current/10"
        >
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
      <p className="text-6xl font-medium tracking-[-0.04em] tabular-nums">{counts.total}</p>
      <ul className="mt-auto flex flex-col gap-1.5">
        {counts.parts.map(part => (
          <li key={part.label} className="flex items-center gap-2 text-sm">
            <span aria-hidden className={cn('size-2 rounded-full', DOT[part.tone])} />
            <span className="flex-1 opacity-80">{part.label}</span>
            <span className="font-medium tabular-nums">{part.value}</span>
          </li>
        ))}
      </ul>
    </OverviewTile>
  )
}
