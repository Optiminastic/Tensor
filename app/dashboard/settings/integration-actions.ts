'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import type { Integration } from '@/lib/validators/integrations'
import {
  IntegrationsServiceError,
  disconnectIntegration,
  saveIntegration,
} from '@/services/integrations.service'

export interface ActionResult<T = undefined> {
  ok: boolean
  error?: string
  data?: T
}

function describe(err: unknown, fallback: string): string {
  // The backend's own sentence, passed through. Its refusals name the field or
  // the reason - "Agent version is a whole number", "cannot be connected yet" -
  // and the admin reading this is the person who can act on that.
  return err instanceof IntegrationsServiceError ? err.message : fallback
}

/**
 * Saves one provider's credentials.
 *
 * The permission is NOT checked here. `integration:manage` is enforced by
 * Tensor-Core against the bearer token, which is the only check that counts: a
 * server action is a public API that can be replayed with any payload.
 */
export async function saveIntegrationAction(
  target: { brand: string; provider: string },
  values: Record<string, string>,
): Promise<ActionResult<Integration[]>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Sign in again.' }
  try {
    const items = await saveIntegration(token, target, values)
    revalidatePath('/dashboard/settings/integrations')
    return { ok: true, data: items }
  } catch (err) {
    return { ok: false, error: describe(err, 'Could not save those credentials.') }
  }
}

export async function disconnectIntegrationAction(
  brand: string,
  provider: string,
): Promise<ActionResult<null>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Sign in again.' }
  try {
    await disconnectIntegration(token, brand, provider)
    revalidatePath('/dashboard/settings/integrations')
    return { ok: true, data: null }
  } catch (err) {
    return { ok: false, error: describe(err, 'Could not disconnect that integration.') }
  }
}
