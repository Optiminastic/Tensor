import type { JSX } from 'react'

import { JOB_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { ProductionJob } from '@/components/production/types'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import { dateTime } from '@/lib/format'

interface RecentJobsTableProps {
  jobs: ProductionJob[]
}

export function RecentJobsTable({ jobs }: RecentJobsTableProps): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent print jobs</CardTitle>
      </CardHeader>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Job</TableHeaderCell>
            <TableHeaderCell>Design</TableHeaderCell>
            <TableHeaderCell>Machine</TableHeaderCell>
            <TableHeaderCell>Started</TableHeaderCell>
            <TableHeaderCell className="text-right">Duration</TableHeaderCell>
            <TableHeaderCell className="text-right">Status</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {jobs.map(job => {
            const status = JOB_STATUS_CONFIG[job.status]
            return (
              <TableRow key={job.id}>
                <TableCell className="font-mono tabular-nums">{job.jobNumber}</TableCell>
                <TableCell>{job.designName}</TableCell>
                <TableCell className="text-muted-foreground">{job.machine}</TableCell>
                <TableCell className="text-muted-foreground">{dateTime(job.startedAt)}</TableCell>
                <TableCell numeric>{job.durationHours.toFixed(2)} h</TableCell>
                <TableCell className="text-right">
                  <TonePill label={status.label} tone={status.tone} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}
