import type { JSX } from 'react'

import { JobQueueRow } from '@/components/production/job-queue-row'
import type { ProductionJobQueueItem } from '@/components/production/types'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table'

interface JobQueueTableProps {
  brand: string
  jobs: ProductionJobQueueItem[]
}

const COLUMNS = [
  'Job',
  'Description',
  'Qty',
  'Status',
  'Personalisation',
  'Packaging',
  'Priority',
  'Created',
]

export function JobQueueTable({ brand, jobs }: JobQueueTableProps): JSX.Element {
  return (
    <Card>
      <Table>
        <TableHead>
          <TableRow>
            {COLUMNS.map(column => (
              <TableHeaderCell key={column}>{column}</TableHeaderCell>
            ))}
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {jobs.map(job => (
            <JobQueueRow key={job.id} brand={brand} job={job} />
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
