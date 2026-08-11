'use client'

import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { skipJobPolishing } from '@/app/dashboard/[brand]/production/polishing-actions'
import { batchLabel, type BatchNumbers } from '@/components/production/batch-label'
import { PolishingCheckDialog } from '@/components/production/polishing-check-dialog'
import { ASSEMBLY_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { AssemblyStatus } from '@/components/production/types'
import { Button } from '@/components/ui/button'
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

interface PolishingQueueTableProps {
  brand: string
  jobs: ProductionJob[]
  batchNumbers: BatchNumbers
}

/** Jobs whose assembly is resolved and that are waiting on finishing -
 * polishing_status = pending (see the Packaging page's Polishing tab). The
 * Assembly column is shown because polishing only unlocks once assembly is
 * completed or marked not required. */
export function PolishingQueueTable({
  brand,
  jobs,
  batchNumbers,
}: PolishingQueueTableProps): JSX.Element {
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
            <PolishingQueueRow
              key={job.id}
              brand={brand}
              job={job}
              batchNumber={batchLabel(job.batch_id, batchNumbers)}
            />
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

interface PolishingQueueRowProps {
  brand: string
  job: ProductionJob
  batchNumber: string
}

function PolishingQueueRow({ brand, job, batchNumber }: PolishingQueueRowProps): JSX.Element {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function skip(): Promise<void> {
    setPending(true)
    setError(null)
    const res = await skipJobPolishing(brand, job.id)
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not skip polishing.')
      return
    }
    router.refresh()
  }

  return (
    <TableRow>
      <TableCell className="font-mono text-sm whitespace-nowrap">{job.job_number}</TableCell>
      <TableCell className="text-muted-foreground font-mono text-sm whitespace-nowrap">
        {batchNumber}
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
        <div className="flex flex-col items-end gap-1">
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" disabled={pending} onClick={() => void skip()}>
              Skip
            </Button>
            <PolishingCheckDialog brand={brand} jobId={job.id} jobNumber={job.job_number} />
          </div>
          {error ? (
            <p role="alert" className="text-danger text-xs">
              {error}
            </p>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  )
}
