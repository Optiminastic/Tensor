import { z } from 'zod'

/**
 * A slicer setting as Bambu's presets hold it: text, or a list of text (one
 * entry per extruder or per filament).
 */
export const PresetValueSchema = z.union([z.string(), z.array(z.string())])
export type PresetValue = z.infer<typeof PresetValueSchema>

/**
 * Tensor's own copy of one BambuBuddy pipeline's presets, plus Tensor's
 * overrides on top of the process. `settings` is the summary as this profile
 * slices: the imported process with the overrides applied.
 */
export const SlicingProfileSchema = z.object({
  id: z.string(),
  bambu_pipeline_id: z.number().nullable(),
  name: z.string(),
  machine_family: z.string(),
  printer_preset_name: z.string(),
  process_preset_name: z.string(),
  filament_preset_name: z.string(),
  overrides: z.record(z.string(), PresetValueSchema),
  settings: z.record(z.string(), PresetValueSchema),
  version: z.number(),
  imported_at: z.string().nullable(),
  updated_by: z.string(),
  updated_at: z.string(),
})
export type SlicingProfile = z.infer<typeof SlicingProfileSchema>

export const SlicingProfileImportSchema = z.object({
  imported: z.array(SlicingProfileSchema),
  skipped: z.array(z.object({ pipeline_id: z.number(), name: z.string(), reason: z.string() })),
})
export type SlicingProfileImport = z.infer<typeof SlicingProfileImportSchema>

/** What the overrides form submits. The backend checks each key against the process. */
export const SlicingOverridesInputSchema = z.object({
  id: z.string().uuid(),
  overrides: z.record(z.string().min(1).max(100), PresetValueSchema),
})
export type SlicingOverridesInput = z.infer<typeof SlicingOverridesInputSchema>

/** A preset value as one line of text, lists joined. */
export function showPresetValue(v: PresetValue | undefined): string {
  if (v === undefined) return ''
  return Array.isArray(v) ? v.join(', ') : v
}
