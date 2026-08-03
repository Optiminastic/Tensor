// Server-only by placement (called from server actions and server components).
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import { type FleetMachine, FleetMachineSchema } from '@/lib/validators/machine-fleet'

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
