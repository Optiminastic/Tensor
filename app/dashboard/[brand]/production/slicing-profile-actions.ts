'use server'

import { resolveBackendToken } from '@/lib/backend-token'
import {
  type SlicingProfile,
  type SlicingProfileImport,
  SlicingOverridesInputSchema,
} from '@/lib/validators/slicing-profiles'
import { RegistryServiceError } from '@/services/registry.service'
import {
  importSlicingProfiles,
  listSlicingProfiles,
  saveSlicingOverrides,
} from '@/services/slicing-profiles.service'

import type { ActionResult } from './actions'

const SESSION_EXPIRED = 'Your session has expired. Sign in again.'

function failure(error: unknown, fallback: string): ActionResult<never> {
  return { ok: false, error: error instanceof RegistryServiceError ? error.message : fallback }
}

/** Every slicing profile, read on demand like the pipeline mappings beside it. */
export async function loadSlicingProfiles(): Promise<ActionResult<SlicingProfile[]>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? SESSION_EXPIRED }
  try {
    return { ok: true, data: await listSlicingProfiles(token) }
  } catch (err) {
    return failure(err, 'Could not read the slicing profiles.')
  }
}

/** Copies, or refreshes, every pipeline's presets from BambuBuddy. */
export async function importSlicingProfilesAction(): Promise<ActionResult<SlicingProfileImport>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? SESSION_EXPIRED }
  try {
    return { ok: true, data: await importSlicingProfiles(token) }
  } catch (err) {
    return failure(err, 'Could not import the profiles from BambuBuddy.')
  }
}

/**
 * Saves one profile's overrides. The arguments are client-controlled, so the
 * shape is re-checked here, and the backend checks every key against the
 * profile's own process preset.
 */
export async function saveSlicingOverridesAction(
  input: unknown,
): Promise<ActionResult<SlicingProfile>> {
  const parsed = SlicingOverridesInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Could not read the settings.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? SESSION_EXPIRED }
  try {
    return {
      ok: true,
      data: await saveSlicingOverrides(token, parsed.data.id, parsed.data.overrides),
    }
  } catch (err) {
    return failure(err, 'Could not save the settings.')
  }
}
