import type { Metadata } from 'next'
import type { JSX } from 'react'

import { toQueueItem } from '@/components/production/adapters'
import { AutoRefresh } from '@/components/production/auto-refresh'
import { JobQueueTable } from '@/components/production/job-queue-table'
import { ProductionPageHeader } from '@/components/production/production-page-header'
import type { ProductionJobQueueItem } from '@/components/production/types'
import { requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import { env } from '@/lib/env'
import { ProductionServiceError, listProductionJobs } from '@/services/production.service'

export const metadata: Metadata = { title: 'Production Jobs' }

interface ProductionJobsPageProps {
  params: Promise<{ brand: string }>
}

export default async function ProductionJobsPage({
  params,
}: ProductionJobsPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('production:read', `/dashboard/${brand}`)

  let jobs: ProductionJobQueueItem[] = []
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      jobs = (await listProductionJobs(token)).map(toQueueItem)
    } catch (err) {
      error =
        err instanceof ProductionServiceError ? err.message : 'Could not load production jobs.'
    }
  }

  return (
    <main className="flex w-full flex-col gap-8 px-6 py-10 md:px-8">
      {/* Nothing on this page polls: it is a server component fetched once.
          Only active when NEXT_PUBLIC_PRODUCTION_REFRESH_SECONDS is set, for
          watching an automated run. */}
      <AutoRefresh
        intervalSeconds={env.NEXT_PUBLIC_PRODUCTION_REFRESH_SECONDS}
        enabled={env.NEXT_PUBLIC_PRODUCTION_REFRESH_SECONDS !== undefined}
      />
      <ProductionPageHeader
        title="Production Jobs"
        description="Every job in the queue, from slicing through packaging."
      />
      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : (
        <JobQueueTable brand={brand} jobs={jobs} />
      )}
    </main>
  )
}
