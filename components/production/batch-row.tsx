'use client'

import { AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { JSX, KeyboardEvent } from 'react'

import { BATCH_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { BatchRecord } from '@/components/production/types'
import { TableCell, TableRow } from '@/components/ui/table'
import { countdown } from '@/lib/format'

interface BatchRowProps {
  brand: string
  batch: BatchRecord
}

export function BatchRow({ brand, batch }: BatchRowProps): JSX.Element {
  const router = useRouter()
  const status = BATCH_STATUS_CONFIG[batch.status]
  const href = `/dashboard/${brand}/production/batches/${batch.id}`

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
      aria-label={`Open ${batch.batchNumber}`}
    >
      <TableCell className="font-mono text-sm">{batch.batchNumber}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <TonePill label={status.label} tone={status.tone} />
          {batch.materialShortage ? (
            <span title="Filament shortage" className="text-warning">
              <AlertTriangle className="size-3.5" aria-hidden />
            </span>
          ) : null}
        </div>
      </TableCell>
      <TableCell numeric>{batch.jobsCount ?? '—'}</TableCell>
      <TableCell numeric>{batch.unitsPerBed ?? '—'}</TableCell>
      <TableCell numeric>
        {batch.totalPrintTimeMinutes !== null ? countdown(batch.totalPrintTimeMinutes * 60) : '—'}
      </TableCell>
      <TableCell numeric>
        {batch.totalFilamentGrams !== null ? `${Math.round(batch.totalFilamentGrams)} g` : '—'}
      </TableCell>
      <TableCell numeric>
        {batch.bedUtilizationPercent !== null ? `${batch.bedUtilizationPercent.toFixed(1)}%` : '—'}
      </TableCell>
    </TableRow>
  )
}
