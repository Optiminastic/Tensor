'use client'

import type { JSX } from 'react'
import { useState } from 'react'

import { ActivityLineChart } from '@/components/production/activity-line-chart'
import type { ActivityPoint } from '@/components/production/types'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ProductionActivityChartProps {
  data: ActivityPoint[]
}

const RANGES = [
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '1Y', months: 12 },
] as const

function ChartLegend(): JSX.Element {
  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="text-muted-foreground flex items-center gap-1.5">
        <span className="bg-success size-1.5 rounded-full" aria-hidden />
        Completed
      </span>
      <span className="text-muted-foreground flex items-center gap-1.5">
        <span className="bg-danger size-1.5 rounded-full" aria-hidden />
        Failed
      </span>
    </div>
  )
}

interface RangeToggleProps {
  active: number
  onChange: (months: number) => void
}

function RangeToggle({ active, onChange }: RangeToggleProps): JSX.Element {
  return (
    <div className="flex items-center gap-1">
      {RANGES.map(range => (
        <Button
          key={range.label}
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(range.months)}
          className={cn(
            'px-2.5',
            active === range.months && 'bg-accent-subtle text-accent hover:bg-accent-subtle',
          )}
        >
          {range.label}
        </Button>
      ))}
    </div>
  )
}

export function ProductionActivityChart({ data }: ProductionActivityChartProps): JSX.Element {
  const [rangeMonths, setRangeMonths] = useState<number>(12)

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle>Print activity</CardTitle>
          <CardDescription>Completed vs failed jobs over time.</CardDescription>
        </div>
        <RangeToggle active={rangeMonths} onChange={setRangeMonths} />
      </CardHeader>
      <div className="flex flex-col gap-4 px-5 py-4">
        <ChartLegend />
        <ActivityLineChart data={data.slice(-rangeMonths)} />
      </div>
    </Card>
  )
}
