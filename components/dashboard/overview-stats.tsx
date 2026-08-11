import type { JSX } from 'react'

import { Stat, type StatSubCount } from '@/components/ui/stat'

export interface OverviewStat {
  label: string
  value: string
  hint?: string
  subCounts?: StatSubCount[]
}

interface OverviewStatsProps {
  stats: OverviewStat[]
}

/**
 * The KPI row at the top of the dashboard. Values arrive pre-formatted as
 * strings so this stays a dumb presentational grid; a dash ("—") stands in for
 * a metric the current user could not load.
 */
export function OverviewStats({ stats }: OverviewStatsProps): JSX.Element {
  return (
    <section aria-label="Overview metrics" className="grid grid-cols-2 gap-1.5 lg:grid-cols-4">
      {stats.map(stat => (
        <Stat
          key={stat.label}
          label={stat.label}
          value={stat.value}
          hint={stat.hint}
          subCounts={stat.subCounts}
        />
      ))}
    </section>
  )
}
