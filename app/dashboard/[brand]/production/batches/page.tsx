import type { Metadata } from 'next'
import type { JSX } from 'react'

import { createSampleBatchRecords, toBatchRecord } from '@/components/production/adapters'
import { AutoCreateBatchesButton } from '@/components/production/auto-create-batches-button'
import { BatchTable } from '@/components/production/batch-table'
import { ProductionPageHeader } from '@/components/production/production-page-header'
import type { BatchRecord } from '@/components/production/types'
import { requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import { BatchServiceError, listBatches } from '@/services/batches.service'

export const metadata: Metadata = { title: 'Batch Management' }

interface BatchManagementPageProps {
  params: Promise<{ brand: string }>
}

export default async function BatchManagementPage({
  params,
}: BatchManagementPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('batch:read', `/dashboard/${brand}`)

  let batches: BatchRecord[] = []
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      batches = (await listBatches(token)).map(toBatchRecord)
    } catch (err) {
      error = err instanceof BatchServiceError ? err.message : 'Could not load batches.'
    }
  }

  return (
    <main className="flex w-full flex-col gap-8 px-6 py-10 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <ProductionPageHeader
          title="Batch Management"
          description="Jobs grouped onto printer beds, ready for approval and dispatch."
        />
        <AutoCreateBatchesButton brand={brand} />
      </div>
      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : batches.length === 0 ? (
        <BatchTable brand={brand} batches={createSampleBatchRecords()} />
      ) : (
        <BatchTable brand={brand} batches={batches} />
      )}
    </main>
  )
}
