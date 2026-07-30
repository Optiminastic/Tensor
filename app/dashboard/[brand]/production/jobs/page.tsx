import type { Metadata } from 'next'
import type { JSX } from 'react'

import { JobQueueTable } from '@/components/production/job-queue-table'
import { ProductionPageHeader } from '@/components/production/production-page-header'
import { PRODUCTION_JOB_QUEUE } from '@/components/production/sample-data'

export const metadata: Metadata = { title: 'Production Jobs' }

interface ProductionJobsPageProps {
  params: Promise<{ brand: string }>
}

export default async function ProductionJobsPage({
  params,
}: ProductionJobsPageProps): Promise<JSX.Element> {
  const { brand } = await params

  return (
    <main className="flex w-full flex-col gap-8 px-6 py-10 md:px-8">
      <ProductionPageHeader
        title="Production Jobs"
        description="Every job in the queue, from slicing through packaging."
      />
      <JobQueueTable brand={brand} jobs={PRODUCTION_JOB_QUEUE} />
    </main>
  )
}
