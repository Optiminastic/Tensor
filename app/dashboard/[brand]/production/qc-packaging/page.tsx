import type { Metadata } from 'next'
import type { JSX } from 'react'

import { ProductionPageHeader } from '@/components/production/production-page-header'
import { QcPackagingTabs } from '@/components/production/qc-packaging-tabs'
import { resolveBackendToken } from '@/lib/backend-token'
import type { ProductionJob } from '@/lib/validators/production'
import { listProductionJobs, ProductionServiceError } from '@/services/production.service'

export const metadata: Metadata = { title: 'QC/Packaging' }

interface QcPackagingPageProps {
  params: Promise<{ brand: string }>
}

/** Two queues: jobs waiting on a QC decision, and jobs that passed QC and are
 * waiting to be packed (internal/httpapi/production_qc.go#submitQc,
 * #submitPackaging). A job's assembly must be completed or not_required
 * before it's QC-ready - the backend's qc_status filter alone can't express
 * that "one of two values" condition, so it's filtered here client-side. */
export default async function QcPackagingPage({
  params,
}: QcPackagingPageProps): Promise<JSX.Element> {
  const { brand } = await params

  let qcJobs: ProductionJob[] = []
  let packagingJobs: ProductionJob[] = []
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      const [awaitingQc, awaitingPackaging] = await Promise.all([
        listProductionJobs(token, { status: 'completed', qc_status: 'pending' }),
        listProductionJobs(token, { qc_status: 'passed', packaging_status: 'pending' }),
      ])
      qcJobs = awaitingQc.filter(job => job.assembly_status !== 'pending')
      packagingJobs = awaitingPackaging
    } catch (err) {
      error = err instanceof ProductionServiceError ? err.message : 'Could not load QC jobs.'
    }
  }

  return (
    <main className="flex w-full flex-col gap-8 px-6 py-10 md:px-8">
      <ProductionPageHeader
        title="QC/Packaging"
        description="Jobs waiting on a quality check, and jobs ready to be packed."
      />
      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : (
        <QcPackagingTabs brand={brand} qcJobs={qcJobs} packagingJobs={packagingJobs} />
      )}
    </main>
  )
}
