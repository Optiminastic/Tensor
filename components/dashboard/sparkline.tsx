'use client'

import type { JSX } from 'react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'

import type { WeekAmount } from '@/lib/dashboard/analytics'

interface SparklineProps {
  data: WeekAmount[]
  color: string
}

/** An axis-free micro area chart - shape of a trend, no chrome. Fills its parent. */
export function Sparkline({ data, color }: SparklineProps): JSX.Element {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 3, right: 0, bottom: 0, left: 0 }}>
          <Area
            dataKey="value"
            type="monotone"
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={0.12}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
