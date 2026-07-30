'use client'

import { Pause } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { JSX, KeyboardEvent, MouseEvent } from 'react'

import {
  PACKAGING_STATUS_CONFIG,
  PERSONALISATION_STATUS_CONFIG,
  QC_STATUS_CONFIG,
  QUEUE_STATUS_CONFIG,
} from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { ProductionJobQueueItem } from '@/components/production/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableCell, TableRow } from '@/components/ui/table'

interface JobQueueRowProps {
  brand: string
  job: ProductionJobQueueItem
}

function stopRowClick(event: MouseEvent): void {
  event.stopPropagation()
}

export function JobQueueRow({ brand, job }: JobQueueRowProps): JSX.Element {
  const router = useRouter()
  const href = `/dashboard/${brand}/production/jobs/${job.id}`

  const openDetail = (): void => router.push(href)
  const onKeyDown = (event: KeyboardEvent<HTMLTableRowElement>): void => {
    if (event.key === 'Enter') openDetail()
  }

  return (
    <TableRow
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={onKeyDown}
      className="cursor-pointer"
      aria-label={`Open ${job.id}`}
    >
      <TableCell className="font-mono text-sm">{job.id}</TableCell>
      <TableCell>{job.description}</TableCell>
      <TableCell numeric>{job.qty}</TableCell>
      <TableCell>
        <TonePill {...QUEUE_STATUS_CONFIG[job.status]} />
      </TableCell>
      <TableCell>
        <TonePill {...PERSONALISATION_STATUS_CONFIG[job.personalisation]} />
      </TableCell>
      <TableCell>
        <TonePill {...QC_STATUS_CONFIG[job.qc]} />
      </TableCell>
      <TableCell>
        <TonePill {...PACKAGING_STATUS_CONFIG[job.packaging]} />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          defaultValue={job.priority}
          readOnly
          data-numeric="true"
          className="h-8 w-16 text-center"
          onClick={stopRowClick}
        />
      </TableCell>
      <TableCell className="text-muted-foreground">{job.createdAt}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2" onClick={stopRowClick}>
          <Button type="button" variant="secondary" size="sm">
            <Pause className="size-3.5" aria-hidden />
            Hold
          </Button>
          <Button type="button" variant="primary" size="sm">
            Start Production
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
