import Link from 'next/link'
import type { JSX } from 'react'

import { OverviewTile } from '@/components/dashboard/overview/overview-tile'
import { TileLabel } from '@/components/dashboard/overview/tile-label'
import { PillLink } from '@/components/landing/pill-link'
import { JOB_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { ProductionJob as RecentJob } from '@/components/production/types'
import { dateTime } from '@/lib/format'

interface RecentJobsTileProps {
  jobs: RecentJob[]
  jobsHref: string
}

/** The newest jobs as rows to open, two columns on a wide screen. */
export function RecentJobsTile({ jobs, jobsHref }: RecentJobsTileProps): JSX.Element {
  return (
    <OverviewTile label="Recent jobs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TileLabel>Recent jobs</TileLabel>
        <PillLink href={jobsHref} tone="outline" className="h-9">
          All jobs
        </PillLink>
      </div>
      {jobs.length === 0 ? (
        <p className="text-muted-foreground py-6 text-sm">
          No jobs yet. They appear as orders come in from Shopify.
        </p>
      ) : (
        <ul className="grid gap-2 lg:grid-cols-2">
          {jobs.map(job => {
            const status = JOB_STATUS_CONFIG[job.status]
            return (
              <li key={job.id}>
                <Link
                  href={`${jobsHref}/${job.id}`}
                  className="bg-surface-muted hover:ring-border-strong flex items-center gap-4 rounded-2xl px-4 py-3 ring-1 ring-transparent transition-shadow"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">{job.designName}</span>
                    <span className="text-muted-foreground truncate font-mono text-xs whitespace-nowrap tabular-nums">
                      {job.jobNumber} · {dateTime(job.startedAt)}
                    </span>
                  </span>
                  <span className="text-muted-foreground font-mono text-xs whitespace-nowrap tabular-nums">
                    {job.durationHours.toFixed(1)} h
                  </span>
                  <TonePill label={status.label} tone={status.tone} />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </OverviewTile>
  )
}
