import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { JSX } from 'react'

import { toBatchRecord, toJobDetail } from '@/components/production/adapters'
import { JobDetailView } from '@/components/production/job-detail-view'
import type { BatchRecord, ProductionJobDetail } from '@/components/production/types'
import { currentAuthz } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import type { Role } from '@/lib/validators/authz'
import { listBatches } from '@/services/batches.service'
import { getProductionJob } from '@/services/production.service'

export const metadata: Metadata = { title: 'Production Job' }

interface ProductionJobPageProps {
  params: Promise<{ brand: string; jobId: string }>
}

export default async function ProductionJobPage({
  params,
}: ProductionJobPageProps): Promise<JSX.Element> {
  const { brand, jobId } = await params
  const { token } = await resolveBackendToken()
  if (!token) notFound()

  let job: ProductionJobDetail
  let batches: BatchRecord[] = []
  let roles: Role[] = []
  try {
    const [rawJob, authz, rawBatches] = await Promise.all([
      getProductionJob(token, jobId),
      currentAuthz(),
      listBatches(token).catch(() => []),
    ])
    job = toJobDetail(rawJob)
    batches = rawBatches.map(toBatchRecord)
    roles = authz.roles
  } catch {
    notFound()
  }

  return (
    <main className="flex w-full flex-col gap-6 px-6 py-10 md:px-8">
      <div className="flex flex-col gap-3">
        <Link
          href={`/dashboard/${brand}/production/jobs`}
          className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to Production Jobs
        </Link>
        <div className="flex flex-col gap-2">
          {/* The number, not the uuid: it is what is written on the plank,
              quoted to the customer, and now what the URL carries. */}
          <h1 className="text-display text-3xl">{job.jobNumber}</h1>
          <p className="text-muted-foreground text-sm">Full production job detail.</p>
        </div>
      </div>
      <JobDetailView brand={brand} job={job} batches={batches} roles={roles} />
    </main>
  )
}
