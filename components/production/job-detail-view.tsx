import type { JSX } from 'react'

import { JobDetailGrid } from '@/components/production/job-detail-grid'
import { JobDetailHeader } from '@/components/production/job-detail-header'
import type { ProductionJobDetail } from '@/components/production/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface JobDetailViewProps {
  job: ProductionJobDetail
}

export function JobDetailView({ job }: JobDetailViewProps): JSX.Element {
  return (
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
          <p className="text-muted-foreground text-sm">{job.personalisationNote}</p>
        </CardContent>
      </Card>
    </div>
  )
}
