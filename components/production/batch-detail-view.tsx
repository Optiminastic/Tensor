import type { JSX } from 'react'

import { BatchDetailGrid } from '@/components/production/batch-detail-grid'
import { BatchDetailHeader } from '@/components/production/batch-detail-header'
import { BatchJobsTable } from '@/components/production/batch-jobs-table'
import { BatchPlatePreview } from '@/components/production/batch-plate-preview'
import { BatchPrintButton } from '@/components/production/batch-print-button'
import type { BatchRecord } from '@/components/production/types'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Machine } from '@/lib/validators/machines'
import type { ProductionJob } from '@/lib/validators/production'

// Matches production.TargetBedUtilisationPercent (internal/production/planner.go) -
// the same "full" threshold the backend enforces server-side on POST /jobs.
const FULL_BATCH_UTILIZATION_PERCENT = 80

interface BatchDetailViewProps {
  brand: string
  batch: BatchRecord
  jobs: ProductionJob[]
  machines: Machine[]
}

export function BatchDetailView({
  brand,
  batch,
  jobs,
  machines,
}: BatchDetailViewProps): JSX.Element {
  const canEditJobs = batch.status === 'pending_approval'
  const isFull = (batch.bedUtilizationPercent ?? 0) >= FULL_BATCH_UTILIZATION_PERCENT

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-start">
      <div className="flex flex-col gap-6">
        <Card>
          <BatchDetailHeader batch={batch} machines={machines} />
          <Separator />
          <BatchDetailGrid batch={batch} />
        </Card>
        <BatchJobsTable
          brand={brand}
          batchId={batch.id}
          jobs={jobs}
          canEdit={canEditJobs}
          isFull={isFull}
        />
      </div>
      <div className="lg:sticky lg:top-6">
        <BatchPlatePreview
          batchId={batch.id}
          batchNumber={batch.batchNumber}
          plateBboxXMm={batch.plateBboxXMm}
          plateBboxYMm={batch.plateBboxYMm}
          plateBboxZMm={batch.plateBboxZMm}
        />
        {/* Locked only, matching BatchDetailSheetContent: a Draft bed is still a
            proposal the next planner pass can dissolve. */}
        {batch.status === 'open' ? (
          <div className="mt-4">
            <BatchPrintButton
              brand={brand}
              batchId={batch.id}
              batchNumber={batch.batchNumber}
              plateSliced={batch.plateSlicedAt !== null}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
