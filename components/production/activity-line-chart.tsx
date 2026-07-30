import type { JSX } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ActivityChartTooltip } from '@/components/production/activity-chart-tooltip'
import type { ActivityPoint } from '@/components/production/types'

interface ActivityLineChartProps {
  data: ActivityPoint[]
}

const AXIS_TICK = { fill: 'var(--subtle-foreground)', fontSize: 11 }

export function ActivityLineChart({ data }: ActivityLineChartProps): JSX.Element {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={AXIS_TICK} />
          <YAxis tickLine={false} axisLine={false} width={40} tick={AXIS_TICK} />
          <Tooltip content={<ActivityChartTooltip />} cursor={{ stroke: 'var(--border-strong)' }} />
          <Line
            dataKey="completed"
            name="Completed"
            type="monotone"
            stroke="var(--success)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }}
          />
          <Line
            dataKey="failed"
            name="Failed"
            type="monotone"
            stroke="var(--danger)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
