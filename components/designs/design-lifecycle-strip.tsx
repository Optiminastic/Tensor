import Link from 'next/link'
import type { JSX } from 'react'

import { filterDesignsByView, type DesignView } from '@/lib/designs/view-filter'
import { cn } from '@/lib/utils'
import type { Design } from '@/lib/validators/designs'

interface DesignLifecycleStripProps {
  brand: string
  /** Every design, unfiltered - the counts are of the whole catalogue. */
  designs: Design[]
  active: DesignView
}

const STAGES: { view: DesignView; label: string }[] = [
  { view: 'all', label: 'All' },
  { view: 'drafts', label: 'Drafts' },
  { view: 'submitted', label: 'Submitted' },
  { view: 'approved', label: 'Approved' },
  { view: 'archived', label: 'Archived' },
]

/**
 * Where every design is in its lifecycle, as counters you can filter by. The
 * counts use the same filter as the list itself, so they cannot disagree.
 */
export function DesignLifecycleStrip({
  brand,
  designs,
  active,
}: DesignLifecycleStripProps): JSX.Element {
  const base = `/dashboard/${brand}/designs`
  return (
    <nav aria-label="Design lifecycle" className="flex flex-wrap gap-2">
      {STAGES.map(stage => {
        const selected = stage.view === active
        return (
          <Link
            key={stage.view}
            href={stage.view === 'all' ? base : `${base}?view=${stage.view}`}
            aria-current={selected ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2.5 rounded-full py-1.5 pr-1.5 pl-4 text-sm transition-colors',
              selected
                ? 'bg-landing-lime text-landing-ink font-medium'
                : 'bg-surface ring-border text-muted-foreground hover:text-foreground ring-1',
            )}
          >
            {stage.label}
            <span
              className={cn(
                'grid h-7 min-w-7 place-items-center rounded-full px-2 font-mono text-xs tabular-nums',
                selected ? 'bg-landing-ink text-white' : 'bg-surface-muted text-foreground',
              )}
            >
              {filterDesignsByView(designs, stage.view).length}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
