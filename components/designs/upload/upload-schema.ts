import { z } from 'zod'

import {
  DesignMachineSpecSchema,
  FinishSchema,
  MaterialSchema,
  QualitySchema,
} from '@/lib/validators/designs'

export const MAX_FILE_MB = 60
export const MAX_PREVIEW_MB = 10
export const MODEL_ACCEPT = '.stl,.3mf,.step,.stp'
const MODEL_EXTENSION = /\.(stl|3mf|step|stp)$/i
const BYTES_PER_MB = 1024 * 1024
const MAX_COLOURS = 20

export const MATERIALS = MaterialSchema.options
export const FINISHES: { value: string; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'sanded', label: 'Sanded' },
  { value: 'painted', label: 'Painted' },
]
export const NOZZLES_MM = [0.2, 0.4, 0.6, 0.8] as const
export const FLOWS: { value: 'standard' | 'high_flow'; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'high_flow', label: 'High Flow' },
]

export const UploadFormSchema = z
  .object({
    name: z.string().min(1, 'Give the design a name').max(160),
    material: MaterialSchema,
    colour: z.string().max(60).optional(),
    finish: FinishSchema,
    units_per_bed: z.number().int().min(1).max(100),
    quality: QualitySchema,
    infill_pct: z.number().min(0).max(100),
    notes: z.string().max(2000).optional(),
    product_type: z.string().max(80).optional(),
    personalisation_type: z.string().max(80).optional(),
    colour_count: z.coerce.number().int().min(1).max(MAX_COLOURS).optional(),
    add_ons: z.string().max(200).optional(),
    packaging_type: z.string().max(80).optional(),
  })
  .extend(DesignMachineSpecSchema.shape)
export type UploadFormValues = z.infer<typeof UploadFormSchema>

export const UPLOAD_DEFAULTS: UploadFormValues = {
  name: '',
  material: 'PLA Basics',
  colour: '',
  finish: 'none',
  units_per_bed: 1,
  quality: '0.20-standard',
  infill_pct: 15,
  notes: '',
  product_type: '',
  personalisation_type: '',
  colour_count: 1,
  add_ons: '',
  packaging_type: '',
  left_nozzle_mm: 0.4,
  right_nozzle_mm: 0.4,
  left_flow: 'standard',
  right_flow: 'standard',
}

/** A Shopify listing being imported into a design: its id + a price snapshot and
 * its photo, so the backend can use that photo as the cover and the design detail
 * can compare true cost against the listing price. */
export interface ShopifyImportSource {
  product_gid: string
  handle: string
  admin_url: string
  image_url: string
  min_price: string
  max_price: string
  currency: string
}

/** A brand the user may create a design under, offered in the global view where
 * the route brand is the "all" sentinel. */
export interface BrandChoice {
  slug: string
  name: string
}

export interface UploadFiles {
  model: File | null
  preview: File | null
  /** Importing from Shopify: the listing photo stands in for a preview. */
  hasListingPhoto: boolean
}

/** The first problem with the chosen files, worded for the designer, or null. */
export function fileProblem({ model, preview, hasListingPhoto }: UploadFiles): string | null {
  if (!model) return 'Choose an STL, 3MF or STEP file.'
  if (!MODEL_EXTENSION.test(model.name)) return 'The model must be an STL, 3MF or STEP file.'
  if (model.size > MAX_FILE_MB * BYTES_PER_MB) {
    return `The model is larger than the ${MAX_FILE_MB} MB limit.`
  }
  if (!preview && !hasListingPhoto) return 'Add a preview image for the design.'
  if (preview && preview.size > MAX_PREVIEW_MB * BYTES_PER_MB) {
    return `The preview image is larger than the ${MAX_PREVIEW_MB} MB limit.`
  }
  return null
}

/** A file size the way a person reads it: KB under a megabyte, else MB. */
export function fileSize(bytes: number): string {
  if (bytes < BYTES_PER_MB) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / BYTES_PER_MB).toFixed(1)} MB`
}

/** Colours read from a 3MF, as the form fields want them. */
export function detectedColourFields(colours: string[]): { colour: string; count: number } {
  return { colour: colours.join(', ').slice(0, 60), count: Math.min(MAX_COLOURS, colours.length) }
}
