import {
  type PresetValue,
  type SlicingProfile,
  type SlicingProfileImport,
  SlicingProfileImportSchema,
  SlicingProfileSchema,
} from '@/lib/validators/slicing-profiles'
import { call, jsonHeaders } from '@/services/registry.service'

/** Every slicing profile Tensor holds, one per imported pipeline. */
export async function listSlicingProfiles(token: string): Promise<SlicingProfile[]> {
  return call('/registry/slicing-profiles', { headers: jsonHeaders(token) }, data =>
    SlicingProfileSchema.array().parse(data),
  )
}

/**
 * Copies every BambuBuddy pipeline's presets into Tensor, or refreshes the
 * copy. Overrides survive a refresh; a pipeline that cannot be copied comes
 * back under `skipped` with the reason.
 */
export async function importSlicingProfiles(token: string): Promise<SlicingProfileImport> {
  return call(
    '/registry/slicing-profiles/import',
    { method: 'POST', headers: jsonHeaders(token) },
    data => SlicingProfileImportSchema.parse(data),
  )
}

/** Replaces one profile's overrides as a whole set. */
export async function saveSlicingOverrides(
  token: string,
  id: string,
  overrides: Record<string, PresetValue>,
): Promise<SlicingProfile> {
  return call(
    `/registry/slicing-profiles/${encodeURIComponent(id)}/overrides`,
    { method: 'PUT', headers: jsonHeaders(token), body: JSON.stringify({ overrides }) },
    data => SlicingProfileSchema.parse(data),
  )
}
