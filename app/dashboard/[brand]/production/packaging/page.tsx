import type { Metadata } from 'next'
import type { JSX } from 'react'

import type { BatchNumbers } from '@/components/production/batch-label'
import {
  PackagingStationTabs,
  type DispatchPanelData,
} from '@/components/production/packaging-station-tabs'
import { ProductionPageHeader } from '@/components/production/production-page-header'
import type { DispatchReadyOrder } from '@/components/production/types'
import { requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import type { Batch } from '@/lib/validators/batches'
import type { DispatchOrder } from '@/lib/validators/dispatch'
import type { Order, ProductionJob } from '@/lib/validators/production'
import { listBatches } from '@/services/batches.service'
import { DispatchServiceError, listDispatchOrders } from '@/services/dispatch.service'
import {
  listOrders,
  listProductionJobs,
  ProductionServiceError,
} from '@/services/production.service'

export const metadata: Metadata = { title: 'Packaging' }

interface PackagingPageProps {
  params: Promise<{ brand: string }>
}

/** Every post-print station on one surface, one tab each in pipeline order:
 * Assembly -> Quality Check -> Packaging -> Dispatch. The first three are
 * queues of production jobs filtered by their sub-status
 * (internal/httpapi/production_qc.go); the fourth is the order-level shipment
 * record (internal/httpapi/dispatch.go). */
export default async function PackagingPage({ params }: PackagingPageProps): Promise<JSX.Element> {
  const { brand } = await params
  // The four stations are all production-job queues, so the page gates on
  // production:read; each tab's write actions are gated separately by the
  // backend (assembly:submit / qc:submit / packaging:submit / dispatch:manage).
  await requirePermission('production:read', `/dashboard/${brand}`)

  let jobs: ProductionJob[] = []
  let batches: Batch[] = []
  let error: string | null = null
  let dispatch: DispatchPanelData = {
    dispatches: [],
    readyOrders: [],
    orderNumbers: {},
    error: null,
  }

  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      jobs = await listProductionJobs(token)
    } catch (err) {
      error = err instanceof ProductionServiceError ? err.message : 'Could not load station queues.'
    }
    if (!error) {
      // batch:read is a separate permission from production:read, so a failure
      // here degrades the Batch column to short ids and the Assembly queue to
      // the job's own status - it never blanks the page.
      batches = await loadBatches(token)
      // Dispatch reads two more permissions (dispatch:read, order:read) than
      // the station queues do, so it carries its own error for the same reason.
      dispatch = await loadDispatch(token, jobs)
    }
  }

  const completedBatchIds = new Set(
    batches.filter(batch => batch.status === 'completed').map(batch => batch.id),
  )
  const batchNumbers: BatchNumbers = Object.fromEntries(
    batches.map(batch => [batch.id, batch.batch_number]),
  )

  return (
    <main className="flex w-full flex-col gap-8 px-6 py-10 md:px-8">
      <ProductionPageHeader
        title="Packaging"
        description="Assembly, quality check, packaging and dispatch queues for printed jobs."
      />
      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : (
        <PackagingStationTabs
          brand={brand}
          queues={{
            // Everything off the printer and not yet assembled. A job counts as
            // printed when its own status says so OR when the batch it was
            // printed in reached Completed on the machine-assignment board -
            // the batch is what an operator actually moves to Done, and a job
            // whose status hasn't caught up would otherwise never appear here.
            assembly: jobs.filter(job => {
              if (job.assembly_status !== 'pending') return false
              if (job.status === 'completed') return true
              return job.batch_id ? completedBatchIds.has(job.batch_id) : false
            }),
            // Assembly resolved, finishing not done yet. The backend enforces
            // the same order: it rejects a finishing check while assembly is
            // still pending.
            finishing: jobs.filter(
              job =>
                job.status === 'completed' &&
                job.finishing_status === 'pending' &&
                job.assembly_status !== 'pending',
            ),
            // Assembly and finishing must each be completed or not_required
            // before a job is QC-ready - the backend's qc_status filter alone
            // can't express those "one of two values" conditions.
            qc: jobs.filter(
              job =>
                job.status === 'completed' &&
                job.qc_status === 'pending' &&
                job.assembly_status !== 'pending' &&
                job.finishing_status !== 'pending',
            ),
            packaging: jobs.filter(
              job => job.qc_status === 'passed' && job.packaging_status === 'pending',
            ),
          }}
          batchNumbers={batchNumbers}
          dispatch={dispatch}
        />
      )}
    </main>
  )
}

/** Batches are read for two reasons: the station queues' Batch column, and
 * knowing which batches an operator has moved to Completed on the
 * machine-assignment board. Best-effort - see the call site. */
async function loadBatches(token: string): Promise<Batch[]> {
  try {
    return await listBatches(token)
  } catch {
    return []
  }
}

/** An order is ready to ship once every one of its jobs is packaged and no
 * shipment has been booked for it yet. */
function toReadyOrders(
  orders: Order[],
  jobs: ProductionJob[],
  dispatches: DispatchOrder[],
): DispatchReadyOrder[] {
  const booked = new Set(dispatches.map(d => d.order_id))
  const byOrder = new Map<string, ProductionJob[]>()
  for (const job of jobs) {
    if (!job.order_id) continue
    const existing = byOrder.get(job.order_id)
    if (existing) existing.push(job)
    else byOrder.set(job.order_id, [job])
  }

  return orders
    .filter(order => {
      if (booked.has(order.id)) return false
      const orderJobs = byOrder.get(order.id)
      if (!orderJobs?.length) return false
      return orderJobs.every(job => job.packaging_status === 'packaged')
    })
    .map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name ?? null,
      jobCount: byOrder.get(order.id)?.length ?? 0,
    }))
}

async function loadDispatch(token: string, jobs: ProductionJob[]): Promise<DispatchPanelData> {
  try {
    const [dispatches, orders] = await Promise.all([
      listDispatchOrders(token),
      listOrders(token, 'live'),
    ])
    return {
      dispatches,
      readyOrders: toReadyOrders(orders, jobs, dispatches),
      orderNumbers: Object.fromEntries(orders.map(order => [order.id, order.order_number])),
      error: null,
    }
  } catch (err) {
    const message =
      err instanceof DispatchServiceError || err instanceof ProductionServiceError
        ? err.message
        : 'Could not load dispatch orders.'
    return { dispatches: [], readyOrders: [], orderNumbers: {}, error: message }
  }
}
