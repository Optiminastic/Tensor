'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import { createLogger } from '@/lib/logger'
import type {
  Design,
  DesignPersonalisationInput,
  PersonalisationEstimate,
  PersonalisationRules,
} from '@/lib/validators/designs'
import { DesignPersonalisationInputSchema } from '@/lib/validators/designs'
import { saveDesignPersonalisation as saveRequest } from '@/services/designs-personalisation.service'
import {
  DesignServiceError,
  type EstimatePersonalisationInput,
  estimatePersonalisation as estimateRequest,
  setDesignPersonalisationRules as setRulesRequest,
} from '@/services/designs.service'

import type { ActionResult } from './actions'

const log = createLogger('DesignPersonalisationActions')

function describe(error: unknown): string {
  if (error instanceof DesignServiceError) return error.message
  log.error({ err: error }, 'Unexpected error in a design personalisation action')
  return 'Something went wrong. Please try again.'
}

// setDesignPersonalisationRulesForBrand stores what personalization a product
// offers (null clears it). Guarded by shopify:publish in the backend.
export async function setDesignPersonalisationRulesForBrand(
  brand: string,
  id: string,
  rules: PersonalisationRules | null,
): Promise<ActionResult<Design>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const design = await setRulesRequest(token, id, rules)
    revalidatePath(`/dashboard/${brand}/designs/${id}`)
    return { ok: true, data: design }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}

// saveDesignPersonalisationForBrand saves the applied personalisation (name +
// placement + colour) and triggers a re-slice from the baked model, so cost and
// layers include the text. An empty text clears it. Guarded by design:update.
export async function saveDesignPersonalisationForBrand(
  brand: string,
  id: string,
  input: DesignPersonalisationInput,
): Promise<ActionResult<Design>> {
  const parsed = DesignPersonalisationInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the personalisation.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const design = await saveRequest(token, id, parsed.data)
    revalidatePath(`/dashboard/${brand}/designs/${id}`)
    return { ok: true, data: design }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}

// estimateDesignPersonalisation returns a fast pre-slice estimate of a name's
// added grams/time/cost. Read-only - no revalidation, safe to call on Apply.
export async function estimateDesignPersonalisation(
  id: string,
  input: EstimatePersonalisationInput,
): Promise<ActionResult<PersonalisationEstimate>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const data = await estimateRequest(token, id, input)
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}
