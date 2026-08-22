// Server-only by placement (called from server actions and server components).
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type FilamentSyncResult,
  FilamentSyncResultSchema,
  type AssemblyInput,
  type Filament,
  type FilamentInput,
  type JobPatchInput,
  type Order,
  type OrderDetail,
  type PackagingInput,
  type FailJobInput,
  type FailJobResult,
  type PersonalisationValidateInput,
  type StationIssueInput,
  type StationIssueResult,
  type FinishingInput,
  type ProductionJob,
  type QcInput,
  type QcSubmitResult,
  FilamentSchema,
  FailJobResultSchema,
  StationIssueResultSchema,
  OrderDetailSchema,
  OrderSchema,
  ProductionJobSchema,
  QcSubmitResultSchema,
} from '@/lib/validators/production'

const log = createLogger('ProductionService')
const TIMEOUT_MS = 15_000

/**
 * Typed client for Tensor-Core's production endpoints (jobs, orders, filament
 * inventory). Server-only; every call carries the caller's bearer token and the
 * backend enforces production/order/filament permissions against it.
 */
export class ProductionServiceError extends Error {}

async function call<T>(path: string, init: RequestInit, parse: (data: unknown) => T): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ path, err: error }, 'Tensor-Core is unreachable')
    throw new ProductionServiceError('Tensor-Core is unreachable. Is the backend running?')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ path, status: response.status, detail }, 'Tensor-Core rejected the request')
    throw new ProductionServiceError(detail ?? `Request failed (${response.status})`)
  }

  if (response.status === 204) return parse(undefined)
  return parse(await response.json())
}

function jsonHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
}

export interface ProductionJobFilters {
  status?: string
  assembly_status?: string
  qc_status?: string
  packaging_status?: string
}

export async function listProductionJobs(
  token: string,
  filters?: ProductionJobFilters,
): Promise<ProductionJob[]> {
  const query = new URLSearchParams(
    Object.entries(filters ?? {}).filter((entry): entry is [string, string] => Boolean(entry[1])),
  ).toString()
  return call(
    `/production-jobs${query ? `?${query}` : ''}`,
    { headers: jsonHeaders(token) },
    data => ProductionJobSchema.array().parse(data),
  )
}

export async function getProductionJob(token: string, id: string): Promise<ProductionJob> {
  return call(`/production-jobs/${encodeURIComponent(id)}`, { headers: jsonHeaders(token) }, data =>
    ProductionJobSchema.parse(data),
  )
}

export async function listProductionJobsForOrder(
  token: string,
  orderId: string,
): Promise<ProductionJob[]> {
  return call(
    `/production-jobs?order_id=${encodeURIComponent(orderId)}`,
    { headers: jsonHeaders(token) },
    data => ProductionJobSchema.array().parse(data),
  )
}

export async function patchProductionJob(
  token: string,
  id: string,
  input: JobPatchInput,
): Promise<ProductionJob> {
  return call(
    `/production-jobs/${encodeURIComponent(id)}`,
    { method: 'PATCH', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => ProductionJobSchema.parse(data),
  )
}

// createJobsFromOrder is the manual backfill path (POST
// /production-jobs/from-order/:order_id) - order sync/Stage 2 normally creates
// jobs automatically via the River worker, this is for an order that predates
// that wiring or needs a retry. Idempotent: a second call for an order that
// already has jobs returns 409, surfaced as a ProductionServiceError.
export async function createJobsFromOrder(
  token: string,
  orderId: string,
): Promise<ProductionJob[]> {
  return call(
    `/production-jobs/from-order/${encodeURIComponent(orderId)}`,
    { method: 'POST', headers: jsonHeaders(token) },
    data => ProductionJobSchema.array().parse(data),
  )
}

export async function listProductionJobsForBatch(
  token: string,
  batchId: string,
): Promise<ProductionJob[]> {
  return call(
    `/production-jobs?batch_id=${encodeURIComponent(batchId)}`,
    { headers: jsonHeaders(token) },
    data => ProductionJobSchema.array().parse(data),
  )
}

export async function validateJobPersonalisation(
  token: string,
  id: string,
  input: PersonalisationValidateInput,
): Promise<ProductionJob> {
  return call(
    `/production-jobs/${encodeURIComponent(id)}/personalisation`,
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => ProductionJobSchema.parse(data),
  )
}

export type OrderSource = 'live' | 'dummy'

export async function listOrders(token: string, source: OrderSource): Promise<Order[]> {
  return call(`/orders?source=${source}`, { headers: jsonHeaders(token) }, data =>
    OrderSchema.array().parse(data),
  )
}

export async function getOrder(token: string, id: string): Promise<OrderDetail> {
  return call(`/orders/${encodeURIComponent(id)}`, { headers: jsonHeaders(token) }, data =>
    OrderDetailSchema.parse(data),
  )
}

export async function listFilament(token: string): Promise<Filament[]> {
  return call('/filament-inventory', { headers: jsonHeaders(token) }, data =>
    FilamentSchema.array().parse(data),
  )
}

/**
 * Mirrors BambuBuddy's spool shelf into Tensor's filament inventory.
 *
 * BambuBuddy tracks individual spools; Tensor tracks availability per material
 * and colour. The backend aggregates, and its figures win - it is where spools
 * are physically scanned and weighed.
 */
export async function syncFilamentFromBambuBuddy(token: string): Promise<FilamentSyncResult> {
  return call('/filament-inventory/sync', { method: 'POST', headers: jsonHeaders(token) }, data =>
    FilamentSyncResultSchema.parse(data),
  )
}

export async function upsertFilament(token: string, input: FilamentInput): Promise<Filament> {
  return call(
    '/filament-inventory',
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => FilamentSchema.parse(data),
  )
}

// The post-print station handlers (assembly, QC, packaging) - each records an
// audit row and advances the job's matching sub-status; the backend gates on
// the prior stage so the order (assembly -> QC -> packaging) can't be skipped.

export async function submitAssembly(
  token: string,
  jobId: string,
  input: AssemblyInput,
): Promise<ProductionJob> {
  return call(
    `/production-jobs/${encodeURIComponent(jobId)}/assembly`,
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => ProductionJobSchema.parse(data),
  )
}

export async function skipAssembly(token: string, jobId: string): Promise<ProductionJob> {
  return call(
    `/production-jobs/${encodeURIComponent(jobId)}/assembly/skip`,
    { method: 'POST', headers: jsonHeaders(token) },
    data => ProductionJobSchema.parse(data),
  )
}

// failProductionJob records a print failure and returns both the failed job
// and the reprint the backend cloned from it at urgent priority. This is also
// how a "reprint" is requested from the completed-batch board: a reprint is
// always attributable to a reason.
export async function failProductionJob(
  token: string,
  jobId: string,
  input: FailJobInput,
): Promise<FailJobResult> {
  return call(
    `/production-jobs/${encodeURIComponent(jobId)}/fail`,
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => FailJobResultSchema.parse(data),
  )
}

// reportStationIssue flags a defect found at assembly, finishing or QC. It does
// not change the job's sub-status - the job stays in its queue and can still be
// completed - so this is additive to the station flow, not a branch of it.
export async function reportStationIssue(
  token: string,
  jobId: string,
  input: StationIssueInput,
): Promise<StationIssueResult> {
  return call(
    `/production-jobs/${encodeURIComponent(jobId)}/issues`,
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => StationIssueResultSchema.parse(data),
  )
}

export async function submitFinishing(
  token: string,
  jobId: string,
  input: FinishingInput,
): Promise<ProductionJob> {
  return call(
    `/production-jobs/${encodeURIComponent(jobId)}/finishing`,
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => ProductionJobSchema.parse(data),
  )
}

export async function skipFinishing(token: string, jobId: string): Promise<ProductionJob> {
  return call(
    `/production-jobs/${encodeURIComponent(jobId)}/finishing/skip`,
    { method: 'POST', headers: jsonHeaders(token) },
    data => ProductionJobSchema.parse(data),
  )
}

export async function submitQc(
  token: string,
  jobId: string,
  input: QcInput,
): Promise<QcSubmitResult> {
  return call(
    `/production-jobs/${encodeURIComponent(jobId)}/qc`,
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => QcSubmitResultSchema.parse(data),
  )
}

export async function submitPackaging(
  token: string,
  jobId: string,
  input: PackagingInput,
): Promise<ProductionJob> {
  return call(
    `/production-jobs/${encodeURIComponent(jobId)}/packaging`,
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => ProductionJobSchema.parse(data),
  )
}
