'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import { createLogger } from '@/lib/logger'
import { type DesignMachine, DesignMachineSpecSchema } from '@/lib/validators/designs'
import {
  DesignServiceError,
  updateDesignMachine as updateMachineRequest,
} from '@/services/designs.service'

import type { ActionResult } from './actions'

const log = createLogger('DesignMachineActions')

function describe(error: unknown): string {
  if (error instanceof DesignServiceError) return error.message
  log.error({ err: error }, 'Unexpected error in a design machine action')
  return 'Something went wrong. Please try again.'
}

// updateDesignMachineForBrand relinks a design to a different dual-nozzle
// slicing config (finding or creating the matching machine_profiles row,
// same as design creation) - the "Machine" tab's edit form.
export async function updateDesignMachineForBrand(
  brand: string,
  id: string,
  input: unknown,
): Promise<ActionResult<DesignMachine>> {
  const parsed = DesignMachineSpecSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the machine answers.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const machine = await updateMachineRequest(token, id, parsed.data)
    revalidatePath(`/dashboard/${brand}/designs/${id}`)
    return { ok: true, data: machine }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}
