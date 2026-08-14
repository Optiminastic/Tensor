'use client'

import { useRouter } from 'next/navigation'
import { useMemo, type JSX } from 'react'

import { BATCH_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { BatchRecord, BatchStatus } from '@/components/production/types'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { countdown, dateTime } from '@/lib/format'

interface BatchGroupedListProps {
  brand: string
  batches: BatchRecord[]
  onStatusChange: (batchId: string, status: BatchStatus) => void
}

const GROUPS: BatchStatus[] = ['pending_approval', 'open', 'in_progress', 'completed']
const STATUS_OPTIONS = GROUPS.map(status => ({
  value: status,
  label: BATCH_STATUS_CONFIG[status].label,
}))

interface BatchListRowProps {
  brand: string
  batch: BatchRecord
  onStatusChange: (batchId: string, status: BatchStatus) => void
}

function BatchListRow({ brand, batch, onStatusChange }: BatchListRowProps): JSX.Element {
  const router = useRouter()
  return (
    <div
      onClick={() => router.push(`/dashboard/${brand}/production/batches/${batch.id}`)}
      className="hover:bg-surface-muted flex cursor-pointer items-center gap-3 border-b px-4 py-3 last:border-b-0"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-mono text-sm font-medium">{batch.batchNumber}</span>
        <span className="text-muted-foreground text-xs">
          {batch.jobsCount ?? 0} jobs · {batch.unitsPerBed ?? '—'} units/bed
        </span>
      </div>
      {batch.materialShortage ? <Badge tone="warning">Shortage</Badge> : null}
      <span className="text-muted-foreground w-20 shrink-0 text-right font-mono text-xs">
        {batch.totalPrintTimeMinutes !== null ? countdown(batch.totalPrintTimeMinutes * 60) : '—'}
      </span>
      <span className="text-muted-foreground w-16 shrink-0 text-right font-mono text-xs">
        {batch.bedUtilizationPercent !== null ? `${batch.bedUtilizationPercent.toFixed(0)}%` : '—'}
      </span>
      <span className="text-subtle-foreground w-24 shrink-0 text-right text-xs">
        {dateTime(batch.createdAt)}
      </span>
      <Select
        value={batch.status}
        onClick={e => e.stopPropagation()}
        onChange={e => onStatusChange(batch.id, e.target.value as BatchStatus)}
        aria-label={`Change status for ${batch.batchNumber}`}
        className="w-32 shrink-0"
      >
        {STATUS_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  )
}

/** The queue's List view: batches grouped into the same four status sections
 * the Board's columns use, each with a status pill + count header - a
 * per-row Select offers the same status change dragging a card does, so
 * List isn't a read-only fallback. */
export function BatchGroupedList({
  brand,
  batches,
  onStatusChange,
}: BatchGroupedListProps): JSX.Element {
  const byStatus = useMemo(() => {
    const map = new Map<BatchStatus, BatchRecord[]>()
    for (const status of GROUPS) map.set(status, [])
    for (const batch of batches) map.get(batch.status)?.push(batch)
    return map
  }, [batches])

  return (
    <Card className="overflow-hidden">
      {GROUPS.map(status => {
        const group = byStatus.get(status) ?? []
        const config = BATCH_STATUS_CONFIG[status]
        return (
          <div key={status}>
            <div className="bg-surface-muted border-border flex items-center gap-2 border-b px-4 py-2">
              <TonePill label={config.label} tone={config.tone} />
              <span className="text-muted-foreground font-mono text-xs tabular-nums">
                {group.length}
              </span>
            </div>
            {group.map(batch => (
              <BatchListRow
                key={batch.id}
                brand={brand}
                batch={batch}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        )
      })}
    </Card>
  )
}
