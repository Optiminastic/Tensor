import type { JSX } from 'react'

import { batchLabel, type BatchNumbers } from '@/components/production/batch-label'
import { QcCheckDialog } from '@/components/production/qc-check-dialog'
import { ASSEMBLY_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { AssemblyStatus } from '@/components/production/types'
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

const COLUMNS = ['Job', 'Batch', 'Description', 'Qty', 'Assembly', 'Customer', 'Created']

interface QcQueueTableProps {
  brand: string
  jobs: ProductionJob[]
  batchNumbers: BatchNumbers
}

/** Jobs ready for QC - assembly done or not required, qc_status = pending
 * (see the Packaging page's Quality Check tab). */
export function QcQueueTable({ brand, jobs, batchNumbers }: QcQueueTableProps): JSX.Element {
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
              <TableCell className="text-muted-foreground font-mono text-sm whitespace-nowrap">
                {batchLabel(job.batch_id, batchNumbers)}
              </TableCell>
              <TableCell>{job.description}</TableCell>
              <TableCell numeric>{job.quantity}</TableCell>
              <TableCell>
                <TonePill {...ASSEMBLY_STATUS_CONFIG[job.assembly_status as AssemblyStatus]} />
              </TableCell>
              <TableCell className="text-muted-foreground">{job.customer_name ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap">
                {dateTime(job.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end">
                  <QcCheckDialog brand={brand} jobId={job.id} jobNumber={job.job_number} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
