import { FileText } from 'lucide-react'
import type { JSX } from 'react'

import { DetailField } from '@/components/production/detail-field'
import { ASSEMBLY_STATUS_CONFIG } from '@/components/production/status-config'
import type { BatchRecord, ProductionJobDetail } from '@/components/production/types'

interface JobDetailGridProps {
  job: ProductionJobDetail
  batches: BatchRecord[]
}

export function JobDetailGrid({ job, batches }: JobDetailGridProps): JSX.Element {
  const batch = batches.find(b => b.id === job.batchId)
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-5 px-5 py-5 md:grid-cols-4">
      <DetailField label="Shopify order ID" value={job.shopifyOrderId} mono />
      <DetailField label="SKU" value={job.sku} mono />
      <DetailField label="Product name" value={job.description} />
      <DetailField label="Quantity" value={job.qty} mono />

      <DetailField label="Material" value={job.material} />
      <DetailField label="Colour profile" value={job.colourProfile} />
      <DetailField label="Machine profile" value={job.machineProfile} mono />
      <DetailField
        label="Filament requirement"
        value={`${job.filamentRequirementG.toFixed(2)} g`}
        mono
      />

      <DetailField label="Estimated print time" value={`${job.estimatedPrintTimeMin} min`} mono />
      <DetailField label="Due date" value={job.dueDate} />
      <DetailField label="Priority" value={job.priority} mono />
      <DetailField
        label="Print file"
        value={
          job.printFileAvailable ? (
            <span className="text-accent inline-flex items-center gap-1.5 font-normal">
              <FileText className="size-3.5" aria-hidden />
              Download
            </span>
          ) : (
            <span className="text-muted-foreground font-normal">Not available</span>
          )
        }
      />

      <DetailField label="Assembly" value={ASSEMBLY_STATUS_CONFIG[job.assemblyStatus].label} />
      <DetailField label="Batch" value={batch ? batch.batchNumber : 'Unassigned'} mono />
      <DetailField label="Hold" value={job.held ? 'On hold' : 'Not held'} />
    </div>
  )
}
