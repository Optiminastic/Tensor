import type { JSX } from 'react'

import { PackagingFormDialog } from '@/components/production/packaging-form-dialog'
import { QC_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { QcStatus } from '@/components/production/types'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import { dateTime } from '@/lib/format'
import type { ProductionJob } from '@/lib/validators/production'

const COLUMNS = ['Job', 'Description', 'Qty', 'QC', 'Customer', 'Created']

interface PackagingQueueTableProps {
  brand: string
  jobs: ProductionJob[]
}

/** Jobs that passed QC and are waiting to be packed - qc_status = passed,
 * packaging_status = pending (see the QC/Packaging page's "Pending Packaging"
 * tab). */
export function PackagingQueueTable({ brand, jobs }: PackagingQueueTableProps): JSX.Element {
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
            <TableRow key={job.id}>
              <TableCell className="font-mono text-sm whitespace-nowrap">
                {job.job_number}
              </TableCell>
              <TableCell>{job.description}</TableCell>
              <TableCell numeric>{job.quantity}</TableCell>
              <TableCell>
                <TonePill {...QC_STATUS_CONFIG[job.qc_status as QcStatus]} />
              </TableCell>
              <TableCell className="text-muted-foreground">{job.customer_name ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap">
                {dateTime(job.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end">
                  <PackagingFormDialog brand={brand} jobId={job.id} jobNumber={job.job_number} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
