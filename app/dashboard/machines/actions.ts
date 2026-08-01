'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import { createLogger } from '@/lib/logger'
import { type Machine, type ProfileOptions, MachineInputSchema } from '@/lib/validators/machines'
import {
  MachineServiceError,
  createMachine,
  deleteMachine as deleteMachineRequest,
  getProfileOptions,
  updateMachine,
  updateMachineCost,
} from '@/services/machines.service'

const log = createLogger('MachineActions')

export interface ActionResult<T = undefined> {
  ok: boolean
  error?: string
  data?: T
}

function describe(error: unknown): string {
  if (error instanceof MachineServiceError) return error.message
  log.error({ err: error }, 'Unexpected error in a machine action')
  return 'Something went wrong. Please try again.'
}

export async function createMachineAction(input: unknown): Promise<ActionResult<Machine>> {
  const parsed = MachineInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the machine settings.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const machine = await createMachine(token, parsed.data)
    revalidatePath('/dashboard/machines')
    return { ok: true, data: machine }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}

export async function updateMachineAction(
  id: string,
  input: unknown,
): Promise<ActionResult<Machine>> {
  const parsed = MachineInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the machine settings.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const machine = await updateMachine(token, id, { ...parsed.data, set_default_colour: true })
    revalidatePath('/dashboard/machines')
    return { ok: true, data: machine }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}

export async function deleteMachineAction(id: string): Promise<ActionResult> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    await deleteMachineRequest(token, id)
    revalidatePath('/dashboard/machines')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}

// updateMachineCostAction sets a machine's hourly cost (config:manage; the backend
// enforces it). The cost surface is separate from the slicing-config surface.
export async function updateMachineCostAction(id: string, cost: number): Promise<ActionResult> {
  if (!Number.isFinite(cost) || cost < 0) {
    return { ok: false, error: 'Cost must be zero or more.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    await updateMachineCost(token, id, cost)
    revalidatePath('/dashboard/machines/cost')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}

// fetchProfileOptions backs the form's filament / layer-height dropdowns, which
// depend on the chosen family + nozzle.
export async function fetchProfileOptions(
  family: string,
  nozzle: number,
): Promise<ActionResult<ProfileOptions>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const options = await getProfileOptions(token, family, nozzle)
    return { ok: true, data: options }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}
