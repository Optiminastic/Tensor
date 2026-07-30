import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { JSX } from 'react'

import { JobDetailView } from '@/components/production/job-detail-view'
import { getProductionJobDetail } from '@/components/production/sample-data'

export const metadata: Metadata = { title: 'Production Job' }

interface ProductionJobPageProps {
  params: Promise<{ brand: string; jobId: string }>
}

export default async function ProductionJobPage({
  params,
}: ProductionJobPageProps): Promise<JSX.Element> {
  const { brand, jobId } = await params
  const job = getProductionJobDetail(jobId)
  if (!job) notFound()

  return (
    <main className="flex w-full flex-col gap-6 px-6 py-10 md:px-8">
      <div className="flex flex-col gap-3">
        <Link
          href={`/dashboard/${brand}/production?view=jobs`}
          className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to Production Jobs
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="text-display text-3xl">Job {job.id}</h1>
          <p className="text-muted-foreground text-sm">Full production job detail.</p>
        </div>
      </div>
      <JobDetailView job={job} />
    </main>
  )
}
