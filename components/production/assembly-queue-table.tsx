'use client'

import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { skipJobAssembly } from '@/app/dashboard/[brand]/production/actions'
import { AssemblyCheckDialog } from '@/components/production/assembly-check-dialog'
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

const COLUMNS = ['Job', 'Description', 'Qty', 'Customer', 'Created']

interface AssemblyQueueTableProps {
  brand: string
  jobs: ProductionJob[]
}

/** Jobs that finished printing and are waiting on the assembly checklist -
 * status = completed, assembly_status = pending (see the assembly page). */
export function AssemblyQueueTable({ brand, jobs }: AssemblyQueueTableProps): JSX.Element {
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
            <AssemblyQueueRow key={job.id} brand={brand} job={job} />
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

interface AssemblyQueueRowProps {
  brand: string
  job: ProductionJob
}

function AssemblyQueueRow({ brand, job }: AssemblyQueueRowProps): JSX.Element {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function skip(): Promise<void> {
    setPending(true)
    setError(null)
    const res = await skipJobAssembly(brand, job.id)
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not skip assembly.')
      return
    }
    router.refresh()
  }

  return (
    <TableRow>
      <TableCell className="font-mono text-sm whitespace-nowrap">{job.job_number}</TableCell>
      <TableCell>{job.description}</TableCell>
      <TableCell numeric>{job.quantity}</TableCell>
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
            <AssemblyCheckDialog brand={brand} jobId={job.id} jobNumber={job.job_number} />
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
