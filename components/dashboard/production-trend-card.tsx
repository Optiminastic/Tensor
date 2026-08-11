'use client'

import type { JSX } from 'react'

import { ActivityAreaChart } from '@/components/dashboard/activity-area-chart'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { WeeklyPoint } from '@/lib/dashboard/analytics'

interface ProductionTrendCardProps {
  data: WeeklyPoint[]
  printHours: number
  filamentKg: number
}

interface SeriesDotProps {
  color: string
  label: string
}

function SeriesDot({ color, label }: SeriesDotProps): JSX.Element {
  return (
    <span className="text-muted-foreground flex items-center gap-1.5">
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      {label}
    </span>
  )
}

/**
 * Production over time: jobs created vs completed per week, with the outstanding
 * workload (queued print hours and filament) called out beside the title so the
 * trend and the backlog read together.
 */
export function ProductionTrendCard({
  data,
  printHours,
  filamentKg,
}: ProductionTrendCardProps): JSX.Element {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle>Production activity</CardTitle>
          <CardDescription>Jobs created vs completed, last 8 weeks.</CardDescription>
        </div>
        <p className="text-subtle-foreground font-mono text-xs tabular-nums">
          {Math.round(printHours)}h queued · {filamentKg.toFixed(1)} kg
        </p>
      </CardHeader>
      <div className="flex flex-1 flex-col gap-4 px-5 py-4">
        <div className="flex items-center gap-4 text-sm">
          <SeriesDot color="var(--accent)" label="Created" />
          <SeriesDot color="var(--success)" label="Completed" />
        </div>
        <div className="min-h-64 flex-1">
          <ActivityAreaChart data={data} />
        </div>
      </div>
    </Card>
  )
}
