import type { JSX } from 'react'

import type { StatusSegment } from '@/lib/dashboard/overview'

interface StatusLegendProps {
  segments: StatusSegment[]
  total: number
  format?: (value: number) => string
}

/**
 * The legend beside a donut or bar: a colour dot, the segment label, its value and
 * share. This is where identity lives - the label is always present, so the chart
 * never relies on colour alone. `format` renders values as money where it fits.
 */
export function StatusLegend({ segments, total, format }: StatusLegendProps): JSX.Element {
  return (
    <ul className="flex flex-col gap-2">
      {segments.map(segment => {
        const share = total ? Math.round((segment.value / total) * 100) : 0
        return (
          <li key={segment.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: segment.color }}
                aria-hidden
              />
              {segment.label}
            </span>
            <span className="text-foreground font-mono tabular-nums">
              {format ? format(segment.value) : segment.value}
              <span className="text-subtle-foreground ml-1.5">{share}%</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
