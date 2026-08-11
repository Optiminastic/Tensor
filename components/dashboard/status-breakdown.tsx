import type { JSX } from 'react'

import type { StatusSegment } from '@/lib/dashboard/overview'

interface StatusBreakdownProps {
  segments: StatusSegment[]
  total: number
}

/**
 * A labelled bar per status: name on the left, a track scaled to the whole in the
 * middle, count and share on the right. Reads a distribution far better than a
 * donut when one bucket dominates - the small slices stay legible.
 */
export function StatusBreakdown({ segments, total }: StatusBreakdownProps): JSX.Element {
  return (
    <ul className="flex flex-col gap-3.5">
      {segments.map(segment => {
        const share = total ? (segment.value / total) * 100 : 0
        return (
          <li
            key={segment.key}
            className="grid grid-cols-[6.5rem_1fr_4.5rem] items-center gap-3 sm:grid-cols-[7.5rem_1fr_4.5rem]"
          >
            <span className="text-muted-foreground flex items-center gap-2 text-sm">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
                aria-hidden
              />
              <span className="truncate">{segment.label}</span>
            </span>
            <span className="bg-surface-muted h-2 w-full overflow-hidden rounded-full">
              <span
                className="block h-full rounded-full"
                style={{ width: `${share}%`, backgroundColor: segment.color }}
                aria-hidden
              />
            </span>
            <span className="text-foreground text-right font-mono text-sm tabular-nums">
              {segment.value}
              <span className="text-subtle-foreground ml-1.5">{Math.round(share)}%</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
