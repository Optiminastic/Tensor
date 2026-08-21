// Server-only by placement (called from server actions and server components).
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type FleetSyncResult,
  FleetSyncResultSchema,
  type FleetMachine,
  type FleetMachineLive,
  FleetMachineLiveSchema,
  FleetMachineSchema,
} from '@/lib/validators/machine-fleet'

const log = createLogger('MachineFleetService')
const TIMEOUT_MS = 15_000

/**
 * Typed client for Tensor-Core's /machine-fleet endpoints (the physical
 * printer fleet - live print-state). Server-only; every call carries the
 * caller's bearer token and the backend enforces machine:read against it.
 */
export class MachineFleetServiceError extends Error {}

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
    throw new MachineFleetServiceError('Tensor-Core is unreachable. Is the backend running?')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ path, status: response.status, detail }, 'Tensor-Core rejected the request')
    throw new MachineFleetServiceError(detail ?? `Request failed (${response.status})`)
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

export async function listFleetMachines(token: string): Promise<FleetMachine[]> {
  return call('/machine-fleet', { headers: jsonHeaders(token) }, data =>
    FleetMachineSchema.array().parse(data),
  )
}

export async function getFleetMachine(token: string, id: string): Promise<FleetMachine> {
  return call(`/machine-fleet/${encodeURIComponent(id)}`, { headers: jsonHeaders(token) }, data =>
    FleetMachineSchema.parse(data),
  )
}

/**
 * A printer's live telemetry, read through to BambuBuddy on demand.
 *
 * Returns null instead of throwing when the printer or BambuBuddy is
 * unreachable (502), not configured (409), or unknown to BambuBuddy (404).
 * Live telemetry is an enrichment: the machine page must still render its
 * queue and scheduling state when the printer cannot be reached, and a 502
 * from a machine that is merely switched off is not an error worth failing
 * the page for.
 */
export async function getFleetMachineLive(
  token: string,
  id: string,
): Promise<FleetMachineLive | null> {
  try {
    return await call(
      `/machine-fleet/${encodeURIComponent(id)}/live`,
      { headers: jsonHeaders(token) },
      data => FleetMachineLiveSchema.parse(data),
    )
  } catch {
    return null
  }
}

export interface PrinterUploadResult {
  file_id: number
  filename: string
  queued: boolean
  duplicate: boolean
  /** BambuBuddy's own reason when it declined to queue the file. Empty when queued. */
  queue_note: string
}

/**
 * Sends a model file to the printer's BambuBuddy library and adds it to the
 * print queue.
 *
 * Content-Type is left unset so fetch adds the multipart boundary itself, the
 * same way createDesign does.
 */
export async function uploadToPrinter(
  token: string,
  machineId: string,
  file: File,
): Promise<PrinterUploadResult> {
  const form = new FormData()
  form.set('file', file, file.name)
  return call(
    `/machine-fleet/${encodeURIComponent(machineId)}/upload`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form },
    data => data as PrinterUploadResult,
  )
}

/**
 * Reconciles the fleet with BambuBuddy: every printer it reports is created or
 * refreshed, anything it no longer reports is removed.
 *
 * Nothing does this on a schedule, so a fresh deployment's Machine Management
 * page is empty until this runs at least once.
 */
export async function syncFleetMachines(token: string): Promise<FleetSyncResult> {
  return call('/machine-fleet/sync', { method: 'POST', headers: jsonHeaders(token) }, data =>
    FleetSyncResultSchema.parse(data),
  )
}
