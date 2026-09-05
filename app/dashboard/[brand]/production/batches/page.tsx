import type { Metadata } from 'next'
import type { JSX } from 'react'

import { toBatchRecord } from '@/components/production/adapters'
import { AutoCreateBatchesButton } from '@/components/production/auto-create-batches-button'
import { AutoRefresh } from '@/components/production/auto-refresh'
import { BatchTable } from '@/components/production/batch-table'
import { ProductionPageHeader } from '@/components/production/production-page-header'
import { RefreshButton } from '@/components/production/refresh-button'
import type { BatchRecord } from '@/components/production/types'
import { requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import { env } from '@/lib/env'
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
      {/* Nothing on this page polls: it is a server component fetched once.
          Only active when NEXT_PUBLIC_PRODUCTION_REFRESH_SECONDS is set, for
          watching an automated run. */}
      <AutoRefresh
        intervalSeconds={env.NEXT_PUBLIC_PRODUCTION_REFRESH_SECONDS}
        enabled={env.NEXT_PUBLIC_PRODUCTION_REFRESH_SECONDS !== undefined}
      />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <ProductionPageHeader
          title="Batch Management"
          description="Jobs grouped onto printer beds, ready for approval and dispatch."
        />
        <div className="flex items-start gap-2">
          <RefreshButton noun="batches" />
          <AutoCreateBatchesButton brand={brand} />
        </div>
      </div>
      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : (
        // Always the real list, including when it is empty - BatchTableGrid
        // renders its own empty state. This used to substitute
        // createSampleBatchRecords() whenever the backend returned nothing,
        // which meant an empty shop floor displayed five invented batches
        // (B-240801-001 and friends) that looked exactly like real rows, with
        // job counts, print times and utilisation figures attached. There is
        // no way for someone reading the page to tell that apart from real
        // production data.
        <BatchTable brand={brand} batches={batches} />
      )}
    </main>
  )
}
