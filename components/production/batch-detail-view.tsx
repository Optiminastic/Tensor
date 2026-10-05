import type { JSX } from 'react'

import { BatchDetailGrid } from '@/components/production/batch-detail-grid'
import { BatchDetailHeader } from '@/components/production/batch-detail-header'
import { BatchDoneDialog } from '@/components/production/batch-done-dialog'
import { isBatchEditable, isBatchFull } from '@/components/production/batch-fullness'
import { BatchJobsTable } from '@/components/production/batch-jobs-table'
import { BatchPlatePreview } from '@/components/production/batch-plate-preview'
import type { BatchRecord } from '@/components/production/types'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Machine } from '@/lib/validators/machines'
import type { ProductionJob } from '@/lib/validators/production'

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
  const canEditJobs = isBatchEditable(batch)
  const isFull = isBatchFull(batch)

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
          plateBboxXMm={batch.plateBboxXMm}
          plateBboxYMm={batch.plateBboxYMm}
          plateBboxZMm={batch.plateBboxZMm}
        />
        {/* No Queue button here either - see batch-row.tsx. The bed is sent by
            the dispatcher; Lock is on the page header for a Draft and in the
            row's actions menu. */}
        {/* Finishing the bed. The operator marking it done has just watched it
            come off the machine. */}
        <div className="mt-4 flex justify-end">
          <BatchDoneDialog
            brand={brand}
            batchId={batch.id}
            batchNumber={batch.batchNumber}
            status={batch.status}
          />
        </div>
      </div>
    </div>
  )
}
