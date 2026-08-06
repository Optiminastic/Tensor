// Server-only by placement (called from server actions, server components, and
// the /api/batches/[id]/preview proxy route).
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type AutoCreateBatchesResult,
  type Batch,
  type BatchApproveInput,
  type BatchPatchInput,
  AutoCreateBatchesResultSchema,
  BatchSchema,
} from '@/lib/validators/batches'

const log = createLogger('BatchService')
const TIMEOUT_MS = 15_000
const FILE_TIMEOUT_MS = 30_000

/**
 * Typed client for Tensor-Core's /batches and /machine-fleet/:id/queue
 * endpoints. Server-only; every call carries the caller's bearer token and the
 * backend enforces batch/machine permissions against it.
 */
export class BatchServiceError extends Error {}

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
    throw new BatchServiceError('Tensor-Core is unreachable. Is the backend running?')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ path, status: response.status, detail }, 'Tensor-Core rejected the request')
    throw new BatchServiceError(detail ?? `Request failed (${response.status})`)
  }

  return parse(await response.json())
}

function jsonHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
}

export async function listBatches(token: string): Promise<Batch[]> {
  return call('/batches', { headers: jsonHeaders(token) }, data => BatchSchema.array().parse(data))
}

export async function getBatch(token: string, id: string): Promise<Batch> {
  return call(`/batches/${encodeURIComponent(id)}`, { headers: jsonHeaders(token) }, data =>
    BatchSchema.parse(data),
  )
}

export async function patchBatch(
  token: string,
  id: string,
  input: BatchPatchInput,
): Promise<Batch> {
  return call(
    `/batches/${encodeURIComponent(id)}`,
    { method: 'PATCH', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => BatchSchema.parse(data),
  )
}

export async function approveBatch(
  token: string,
  id: string,
  input: BatchApproveInput,
): Promise<Batch> {
  return call(
    `/batches/${encodeURIComponent(id)}/approve`,
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => BatchSchema.parse(data),
  )
}

export async function autoCreateBatches(token: string): Promise<AutoCreateBatchesResult> {
  return call('/batches/auto-create', { method: 'POST', headers: jsonHeaders(token) }, data =>
    AutoCreateBatchesResultSchema.parse(data),
  )
}

export async function getFleetMachineQueue(
  token: string,
  fleetMachineId: string,
): Promise<Batch[]> {
  return call(
    `/machine-fleet/${encodeURIComponent(fleetMachineId)}/queue`,
    { headers: jsonHeaders(token) },
    data => BatchSchema.array().parse(data),
  )
}

// fetchBatchPreview streams the batch's merged-plate STL. Returns the raw
// Response so the /api/batches/[id]/preview route can pipe the body straight
// through without buffering, same pattern as designs.service.ts#fetchDesignFile.
export async function fetchBatchPreview(token: string, id: string): Promise<Response> {
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}/batches/${encodeURIComponent(id)}/preview`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(FILE_TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ id, err: error }, 'Tensor-Core is unreachable')
    throw new BatchServiceError('Tensor-Core is unreachable. Is the backend running?')
  }
  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    throw new BatchServiceError(detail ?? `Request failed (${response.status})`)
  }
  return response
}
