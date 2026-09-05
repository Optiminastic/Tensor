import type { JSX } from 'react'

import { JobCustomisationCard } from '@/components/production/job-customisation-card'
import { JobDetailGrid } from '@/components/production/job-detail-grid'
import { JobDetailHeader } from '@/components/production/job-detail-header'
import { JobModelPreview } from '@/components/production/job-model-preview'
import { PersonalisationLog } from '@/components/production/personalisation-log'
import type { BatchRecord, ProductionJobDetail } from '@/components/production/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Role } from '@/lib/validators/authz'

interface JobDetailViewProps {
  brand: string
  job: ProductionJobDetail
  batches: BatchRecord[]
  roles: Role[]
}

export function JobDetailView({ brand, job, batches, roles }: JobDetailViewProps): JSX.Element {
  return (
    <div className="grid gap-6 md:grid-cols-[2fr_3fr]">
      <div className="flex flex-col gap-6">
        <Card>
          <JobDetailHeader brand={brand} job={job} batches={batches} roles={roles} />
          <Separator />
          <JobDetailGrid job={job} batches={batches} />
        </Card>
        <JobCustomisationCard job={job} />
        <Card>
          <CardHeader>
            <CardTitle>Personalisation checks</CardTitle>
          </CardHeader>
          <CardContent>
            <PersonalisationLog brand={brand} job={job} />
          </CardContent>
        </Card>
      </div>
      <JobModelPreview jobId={job.id} modelStatus={job.modelStatus} printFileId={job.printFileId} />
    </div>
  )
}
