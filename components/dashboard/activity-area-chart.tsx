'use client'

import type { JSX } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ActivityChartTooltip } from '@/components/production/activity-chart-tooltip'
import type { WeeklyPoint } from '@/lib/dashboard/analytics'

interface ActivityAreaChartProps {
  data: WeeklyPoint[]
}

const AXIS_TICK = { fill: 'var(--subtle-foreground)', fontSize: 11 }

// Two count series on one axis (no dual scale): created is the accent lead, completed
// the success fill. Faint area fills read as volume without becoming decoration.
export function ActivityAreaChart({ data }: ActivityAreaChartProps): JSX.Element {
  return (
    <div className="h-full min-h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="week" tickLine={false} axisLine={false} tick={AXIS_TICK} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={40}
            allowDecimals={false}
            tick={AXIS_TICK}
          />
          <Tooltip content={<ActivityChartTooltip />} cursor={{ stroke: 'var(--border-strong)' }} />
          <Area
            dataKey="created"
            name="Created"
            type="monotone"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="var(--accent)"
            fillOpacity={0.1}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }}
          />
          <Area
            dataKey="completed"
            name="Completed"
            type="monotone"
            stroke="var(--success)"
            strokeWidth={2}
            fill="var(--success)"
            fillOpacity={0.1}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
