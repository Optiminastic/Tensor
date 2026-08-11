import type { JSX } from 'react'

import { DetailField } from '@/components/production/detail-field'
import type { BatchRecord } from '@/components/production/types'
import { countdown } from '@/lib/format'

interface BatchDetailGridProps {
  batch: BatchRecord
}

export function BatchDetailGrid({ batch }: BatchDetailGridProps): JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-5 px-5 py-5 md:grid-cols-4">
      <DetailField label="Jobs" value={batch.jobsCount ?? '—'} mono />
      <DetailField label="Units per bed" value={batch.unitsPerBed ?? '—'} mono />
      <DetailField
        label="Print time"
        value={
          batch.totalPrintTimeMinutes !== null ? countdown(batch.totalPrintTimeMinutes * 60) : '—'
        }
        mono
      />
      <DetailField
        label="Effective time / unit"
        value={
          batch.effectiveTimePerUnitMinutes !== null
            ? `${batch.effectiveTimePerUnitMinutes.toFixed(1)} min`
            : '—'
        }
        mono
      />

      <DetailField
        label="Filament"
        value={
          batch.totalFilamentGrams !== null ? `${Math.round(batch.totalFilamentGrams)} g` : '—'
        }
        mono
      />
      <DetailField
        label="Bed utilisation"
        value={
          batch.bedUtilizationPercent !== null ? `${batch.bedUtilizationPercent.toFixed(1)}%` : '—'
        }
        mono
      />
      <DetailField
        label="Occupied area"
        value={
          batch.occupiedAreaMm2 !== null ? `${(batch.occupiedAreaMm2 / 100).toFixed(0)} cm²` : '—'
        }
        mono
      />
      <DetailField
        label="Free area"
        value={batch.freeAreaMm2 !== null ? `${(batch.freeAreaMm2 / 100).toFixed(0)} cm²` : '—'}
        mono
      />

      <DetailField label="Packing strategy" value={batch.packingStrategy ?? '—'} mono />
      <DetailField
        label="Filament shortage"
        value={
          batch.materialShortage ? (
            <span className="text-warning">Yes</span>
          ) : (
            <span className="text-muted-foreground">No</span>
          )
        }
      />
    </div>
  )
}
