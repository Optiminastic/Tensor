import type { JSX } from 'react'

import type { StatusSegment } from '@/lib/dashboard/overview'

interface SegmentedBarProps {
  segments: StatusSegment[]
  total: number
  ariaLabel: string
}

/**
 * A horizontal part-to-whole bar: each segment is sized by its share, separated by
 * a 2px surface gap, with rounded ends. Preferred over a stacked pie for a single
 * "how is this whole split" question. Falls back to an empty track when there is
 * nothing to show.
 */
export function SegmentedBar({ segments, total, ariaLabel }: SegmentedBarProps): JSX.Element {
  const visible = segments.filter(segment => segment.value > 0)
  if (total === 0 || visible.length === 0) {
    return <div className="bg-border h-3 w-full rounded-full" aria-hidden />
  }

  return (
    <div className="flex h-3 w-full gap-0.5" role="img" aria-label={ariaLabel}>
      {visible.map(segment => {
        const share = Math.round((segment.value / total) * 100)
        return (
          <div
            key={segment.key}
            className="h-full rounded-full"
            style={{ width: `${(segment.value / total) * 100}%`, backgroundColor: segment.color }}
            title={`${segment.label}: ${share}%`}
          />
        )
      })}
    </div>
  )
}
