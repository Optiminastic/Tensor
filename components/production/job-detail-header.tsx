import type { JSX } from 'react'

import {
  PACKAGING_STATUS_CONFIG,
  PERSONALISATION_STATUS_CONFIG,
  QC_STATUS_CONFIG,
  QUEUE_STATUS_CONFIG,
} from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { ProductionJobDetail } from '@/components/production/types'

interface JobDetailHeaderProps {
  job: ProductionJobDetail
}

export function JobDetailHeader({ job }: JobDetailHeaderProps): JSX.Element {
  const status = QUEUE_STATUS_CONFIG[job.status]
  const qc = QC_STATUS_CONFIG[job.qc]
  const packaging = PACKAGING_STATUS_CONFIG[job.packaging]
  const personalisation = PERSONALISATION_STATUS_CONFIG[job.personalisation]

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-foreground text-base font-semibold">{job.jobNumber}</span>
          <TonePill label={status.label} tone={status.tone} />
        </div>
        <p className="text-muted-foreground text-xs">Created {job.createdAt}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <TonePill label={`QC: ${qc.label}`} tone={qc.tone} />
        <TonePill label={`Packaging: ${packaging.label}`} tone={packaging.tone} />
        <TonePill label={`Personalisation: ${personalisation.label}`} tone={personalisation.tone} />
      </div>
    </div>
  )
}
