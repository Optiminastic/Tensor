'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import { type Machine, MachineStatusSchema } from '@/lib/validators/machines'
import { type Filament, FilamentInputSchema } from '@/lib/validators/production'
import { MachineServiceError, updateMachine } from '@/services/machines.service'
import { ProductionServiceError, upsertFilament } from '@/services/production.service'

export interface ActionResult<T = undefined> {
  ok: boolean
  error?: string
  data?: T
}

// addFilament upserts a filament stock line (material + colour, grams available and
// reorder threshold). The backend enforces filament:manage; a duplicate (material,
// colour) updates the existing line rather than creating a second.
export async function addFilament(brand: string, input: unknown): Promise<ActionResult<Filament>> {
  const parsed = FilamentInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the filament details.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const filament = await upsertFilament(token, parsed.data)
    revalidatePath(`/dashboard/${brand}/production/inventory`)
    return { ok: true, data: filament }
  } catch (err) {
    const message =
      err instanceof ProductionServiceError ? err.message : 'Could not save the filament.'
    return { ok: false, error: message }
  }
}

// setMachineStatus changes a machine's live status from the production surface. It
// is a partial PATCH (status only); the backend enforces machine:manage. Both the
// list row and the detail panel call it and revalidate so the badge tracks the
// persisted value.
export async function setMachineStatus(
  brand: string,
  machineId: string,
  status: unknown,
): Promise<ActionResult<Machine>> {
  const parsed = MachineStatusSchema.safeParse(status)
  if (!parsed.success) return { ok: false, error: 'Unknown machine status.' }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const machine = await updateMachine(token, machineId, { status: parsed.data })
    revalidatePath(`/dashboard/${brand}/production/machines`)
    revalidatePath(`/dashboard/${brand}/production/machines/${machineId}`)
    return { ok: true, data: machine }
  } catch (err) {
    const message =
      err instanceof MachineServiceError ? err.message : 'Could not update the machine status.'
    return { ok: false, error: message }
  }
}
