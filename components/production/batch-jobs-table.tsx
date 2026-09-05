'use client'

import { Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { removeJobFromBatchAction } from '@/app/dashboard/[brand]/production/actions'
import { AddJobsToBatchDialog } from '@/components/production/add-jobs-to-batch-dialog'
import { orderNumberFromJobNumber } from '@/components/production/order-number'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import type { ProductionJob } from '@/lib/validators/production'

interface BatchJobsTableProps {
  brand: string
  batchId: string
  jobs: ProductionJob[]
  canEdit: boolean
  isFull: boolean
}

export function BatchJobsTable({
  brand,
  batchId,
  jobs,
  canEdit,
  isFull,
}: BatchJobsTableProps): JSX.Element {
  const router = useRouter()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function remove(jobId: string): Promise<void> {
    setRemovingId(jobId)
    setError(null)
    const res = await removeJobFromBatchAction(brand, batchId, jobId)
    setRemovingId(null)
    if (!res.ok) {
      setError(res.error ?? 'Could not remove the job.')
      return
    }
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Jobs in this batch</CardTitle>
        <AddJobsToBatchDialog brand={brand} batchId={batchId} canEdit={canEdit} isFull={isFull} />
      </CardHeader>
      <CardContent className="flex flex-col gap-2 p-0">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Job</TableHeaderCell>
              <TableHeaderCell>Order</TableHeaderCell>
              <TableHeaderCell>Product</TableHeaderCell>
              <TableHeaderCell>SKU</TableHeaderCell>
              <TableHeaderCell className="text-right">Quantity</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              {canEdit ? <TableHeaderCell className="text-right">{''}</TableHeaderCell> : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map(job => (
              <TableRow key={job.id}>
                <TableCell className="font-mono text-sm">
                  <Link
                    href={`/dashboard/${brand}/production/jobs/${job.job_number}`}
                    className="text-accent hover:underline"
                  >
                    {job.job_number}
                  </Link>
                </TableCell>
                {/* The order number, green once the plank is signed off. The
                    floor works from order numbers, and colouring the finished
                    ones is what makes a half-done plate readable at a glance -
                    three green, one grey still to go. */}
                <TableCell>
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-xs tabular-nums ${
                      job.status === 'completed'
                        ? 'bg-success-subtle text-success'
                        : 'bg-surface-muted text-muted-foreground'
                    }`}
                  >
                    {orderNumberFromJobNumber(job.job_number)}
                  </span>
                </TableCell>
                <TableCell>{job.product_name ?? job.description}</TableCell>
                <TableCell className="text-muted-foreground font-mono text-sm">
                  {job.sku ?? '—'}
                </TableCell>
                <TableCell numeric>{job.quantity}</TableCell>
                <TableCell className="text-muted-foreground">{job.status}</TableCell>
                {canEdit ? (
                  <TableCell className="text-right">
                    <button
                      type="button"
                      disabled={removingId === job.id}
                      onClick={() => void remove(job.id)}
                      aria-label={`Remove ${job.job_number} from this batch`}
                      className="text-muted-foreground hover:text-danger inline-flex size-7 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {error ? (
          <p role="alert" className="text-danger px-4 pb-3 text-sm">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
