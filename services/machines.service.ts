// Server-only by placement (called from server actions and server components).
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type Machine,
  type MachineCost,
  type MachineInput,
  type ProfileOptions,
  MachineCostSchema,
  MachineSchema,
  ProfileOptionsSchema,
} from '@/lib/validators/machines'

const log = createLogger('MachineService')
const TIMEOUT_MS = 15_000

/**
 * Typed client for Tensor-Core's /machines endpoints (slicing config; cost lives
 * on /config/machines). Server-only; every call carries the caller's bearer token
 * and the backend enforces machine:* / config:* against it.
 */
export class MachineServiceError extends Error {}

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
    throw new MachineServiceError('Tensor-Core is unreachable. Is the backend running?')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ path, status: response.status, detail }, 'Tensor-Core rejected the machine request')
    throw new MachineServiceError(detail ?? `Request failed (${response.status})`)
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

export async function listMachines(token: string): Promise<Machine[]> {
  return call('/machines', { headers: jsonHeaders(token) }, data =>
    MachineSchema.array().parse(data),
  )
}

export async function getMachine(token: string, id: string): Promise<Machine> {
  return call(`/machines/${encodeURIComponent(id)}`, { headers: jsonHeaders(token) }, data =>
    MachineSchema.parse(data),
  )
}

export async function createMachine(token: string, input: MachineInput): Promise<Machine> {
  return call(
    '/machines',
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => MachineSchema.parse(data),
  )
}

export async function updateMachine(
  token: string,
  id: string,
  input: Partial<MachineInput> & { set_default_colour?: boolean },
): Promise<Machine> {
  return call(
    `/machines/${encodeURIComponent(id)}`,
    { method: 'PATCH', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => MachineSchema.parse(data),
  )
}

export async function deleteMachine(token: string, id: string): Promise<void> {
  await call(
    `/machines/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: jsonHeaders(token),
    },
    () => undefined,
  )
}

export async function getProfileOptions(
  token: string,
  family: string,
  nozzle: number,
): Promise<ProfileOptions> {
  const query = new URLSearchParams({ family, nozzle: String(nozzle) })
  return call(`/machines/profile-options?${query}`, { headers: jsonHeaders(token) }, data =>
    ProfileOptionsSchema.parse(data),
  )
}

/** Lists machines with their hourly cost (config:manage) - the cost surface. */
export async function listMachinesWithCost(token: string): Promise<MachineCost[]> {
  return call('/config/machines', { headers: jsonHeaders(token) }, data =>
    MachineCostSchema.array().parse(data),
  )
}

/** Sets a machine's hourly cost (config:manage). The only machine field on the
 * cost surface; everything else is on /machines. */
export async function updateMachineCost(
  token: string,
  id: string,
  machineHourCost: number,
): Promise<void> {
  await call(
    `/config/machines/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: jsonHeaders(token),
      body: JSON.stringify({ machine_hour_cost: machineHourCost }),
    },
    () => undefined,
  )
}
