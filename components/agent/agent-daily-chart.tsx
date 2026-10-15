'use client'

import type { JSX } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ActivityChartTooltip } from '@/components/production/activity-chart-tooltip'
import type { DailyPoint } from '@/lib/agent-overview'

interface AgentDailyChartProps {
  data: DailyPoint[]
}

const AXIS_TICK = { fill: 'var(--subtle-foreground)', fontSize: 11 }

const SERIES: { key: keyof Omit<DailyPoint, 'label'>; title: string; color: string }[] = [
  { key: 'calls', title: 'Calls placed', color: 'var(--accent)' },
  { key: 'messages', title: 'WhatsApp messages', color: 'var(--accent)' },
  // Success, not a third hue: a recovery is an outcome, the same state the
  // "Recovered" badge marks on the checkout list.
  { key: 'recoveries', title: 'Checkouts recovered', color: 'var(--success)' },
]

/**
 * Per day, as small multiples sharing one date axis.
 *
 * Three charts rather than one with three series: the counts are of different
 * things on different scales (a day can hold forty calls and one recovery),
 * and on a shared axis the recoveries - the series that matters most - would
 * be a flat line along the floor. Each chart is one series, so the title
 * names it and no legend is needed.
 */
export function AgentDailyChart({ data }: AgentDailyChartProps): JSX.Element {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {SERIES.map(series => (
        <figure
          key={series.key}
          className="border-border bg-surface flex flex-col gap-2 rounded-lg border p-4 shadow-xs"
        >
          <figcaption className="flex items-baseline justify-between gap-3">
            <span className="text-foreground text-sm font-medium">{series.title}</span>
            <span className="text-muted-foreground font-mono text-sm tabular-nums">
              {data.reduce((sum, point) => sum + point[series.key], 0)}
            </span>
          </figcaption>
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: -24 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={AXIS_TICK}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  allowDecimals={false}
                  tick={AXIS_TICK}
                />
                <Tooltip
                  content={<ActivityChartTooltip />}
                  cursor={{ fill: 'var(--surface-muted)' }}
                />
                <Bar
                  dataKey={series.key}
                  name={series.title}
                  fill={series.color}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </figure>
      ))}
    </div>
  )
}
