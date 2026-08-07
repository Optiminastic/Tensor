import type { Metadata } from 'next'
import type { JSX } from 'react'

import { AssemblyQueueTable } from '@/components/production/assembly-queue-table'
import { ProductionPageHeader } from '@/components/production/production-page-header'
import { resolveBackendToken } from '@/lib/backend-token'
import type { ProductionJob } from '@/lib/validators/production'
import { listProductionJobs, ProductionServiceError } from '@/services/production.service'

export const metadata: Metadata = { title: 'Assembly' }

interface AssemblyPageProps {
  params: Promise<{ brand: string }>
}

/** Jobs that finished printing and are waiting on the assembly checklist
 * before they can move to QC (internal/httpapi/production_qc.go#submitAssembly). */
export default async function AssemblyPage({ params }: AssemblyPageProps): Promise<JSX.Element> {
  const { brand } = await params

  let jobs: ProductionJob[] = []
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      jobs = await listProductionJobs(token, { status: 'completed', assembly_status: 'pending' })
    } catch (err) {
      error = err instanceof ProductionServiceError ? err.message : 'Could not load assembly jobs.'
    }
  }

  return (
    <main className="flex w-full flex-col gap-8 px-6 py-10 md:px-8">
      <ProductionPageHeader
        title="Assembly"
        description="Printed jobs waiting on the assembly checklist before QC."
      />
      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : (
        <AssemblyQueueTable brand={brand} jobs={jobs} />
      )}
    </main>
  )
}
