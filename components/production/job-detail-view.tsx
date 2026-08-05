import type { JSX } from 'react'

import { JobDetailGrid } from '@/components/production/job-detail-grid'
import { JobDetailHeader } from '@/components/production/job-detail-header'
import { JobModelPreview } from '@/components/production/job-model-preview'
import { PersonalisationLog } from '@/components/production/personalisation-log'
import type { ProductionJobDetail } from '@/components/production/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface JobDetailViewProps {
  brand: string
  job: ProductionJobDetail
}

export function JobDetailView({ brand, job }: JobDetailViewProps): JSX.Element {
  return (
    <div className="grid gap-6 md:grid-cols-[2fr_3fr]">
      <div className="flex flex-col gap-6">
        <Card>
          <JobDetailHeader job={job} />
          <Separator />
          <JobDetailGrid job={job} />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Customer personalisation</CardTitle>
          </CardHeader>
          <CardContent>
            <PersonalisationLog brand={brand} job={job} />
          </CardContent>
        </Card>
      </div>
      <JobModelPreview
        printFileId={job.printFileId}
        fileName={job.sku && job.sku !== '-' ? `${job.sku}-model` : `${job.id}-model`}
      />
    </div>
  )
}
