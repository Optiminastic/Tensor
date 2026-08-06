import type { JSX } from 'react'

import { BatchDetailGrid } from '@/components/production/batch-detail-grid'
import { BatchDetailHeader } from '@/components/production/batch-detail-header'
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
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <BatchDetailHeader brand={brand} batch={batch} machines={machines} />
        <Separator />
        <BatchDetailGrid batch={batch} />
      </Card>
      <BatchPlatePreview
        batchId={batch.id}
        batchNumber={batch.batchNumber}
        plateBboxXMm={batch.plateBboxXMm}
        plateBboxYMm={batch.plateBboxYMm}
        plateBboxZMm={batch.plateBboxZMm}
      />
      <BatchJobsTable brand={brand} jobs={jobs} />
    </div>
  )
}
