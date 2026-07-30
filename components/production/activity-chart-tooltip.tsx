import type { JSX } from 'react'
import type { TooltipProps } from 'recharts'

interface SeriesEntry {
  dataKey: string
  value: number
  color: string
  name: string
}

function isSeriesEntry(entry: unknown): entry is SeriesEntry {
  return typeof entry === 'object' && entry !== null && 'dataKey' in entry
}

export function ActivityChartTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>): JSX.Element | null {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="border-border bg-surface min-w-32 rounded-md border px-3 py-2 shadow-md">
      <p className="text-subtle-foreground text-xs font-medium uppercase">{label}</p>
      <ul className="mt-1.5 flex flex-col gap-1">
        {payload.filter(isSeriesEntry).map(entry => (
          <li key={entry.dataKey} className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: entry.color }}
                aria-hidden
              />
              {entry.name}
            </span>
            <span className="text-foreground font-mono tabular-nums">{entry.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
