// Multipart parsing for the design upload / Shopify-import flow, split from
// actions.ts to keep that server-action file within the line budget. Pure
// functions over a FormData - no server action, no I/O.
import {
  type DesignMachineSpec,
  type DesignSpecs,
  DesignMachineSpecSchema,
  DesignSpecsSchema,
} from '@/lib/validators/designs'

export interface ParsedUpload {
  name: string
  specs: DesignSpecs
  machine: DesignMachineSpec
  file: File
  // Exactly one of preview / previewUrl is set. previewUrl is the Shopify-import
  // path: the backend fetches the listing photo instead of an uploaded file.
  preview?: File
  previewUrl?: string
  notes?: string
  attributes?: Record<string, string>
}

// The optional upload-metadata + Shopify-import snapshot keys threaded through as
// the design's attributes jsonb. The backend re-validates and stores them.
const ATTRIBUTE_KEYS = [
  'product_type',
  'personalisation_type',
  'colour_count',
  'add_ons',
  'packaging_type',
  'shopify_product_gid',
  'shopify_handle',
  'shopify_admin_url',
  'shopify_min_price',
  'shopify_max_price',
  'shopify_currency',
]

// readUploadFiles validates the model file and resolves the cover image: an
// uploaded preview, or (Shopify import) a preview_url the backend will fetch. When
// neither is present it returns an error with no file, so callers check file only.
function readUploadFiles(formData: FormData): {
  file?: File
  preview?: File
  previewUrl?: string
  error?: string
} {
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choose an STL, 3MF or STEP file.' }
  }
  const preview = formData.get('preview')
  if (preview instanceof File && preview.size > 0) {
    return { file, preview }
  }
  const previewUrl = String(formData.get('preview_url') ?? '').trim()
  if (previewUrl) {
    return { file, previewUrl }
  }
  return { error: 'Upload a preview image for the design.' }
}

// parseMachineSpec pulls the dual-nozzle slicing config off the multipart
// form (auto-linked to a machine_profiles row server-side - see
// internal/httpapi/design_machine_link.go).
function parseMachineSpec(formData: FormData): { value?: DesignMachineSpec; error?: string } {
  const machine = DesignMachineSpecSchema.safeParse({
    left_nozzle_mm: Number(formData.get('left_nozzle_mm')),
    right_nozzle_mm: Number(formData.get('right_nozzle_mm')),
    left_flow: formData.get('left_flow'),
    right_flow: formData.get('right_flow'),
  })
  if (!machine.success) {
    return {
      error: machine.error.issues[0]?.message ?? 'Check the nozzle/flow answers and try again.',
    }
  }
  return { value: machine.data }
}

// readAttributes collects the optional upload-metadata + Shopify snapshot fields.
// Empty fields are dropped; the backend validates and stores the rest.
function readAttributes(formData: FormData): Record<string, string> | undefined {
  const out: Record<string, string> = {}
  for (const key of ATTRIBUTE_KEYS) {
    const value = String(formData.get(key) ?? '').trim()
    if (value) out[key] = value
  }
  return Object.keys(out).length > 0 ? out : undefined
}

// readNotes pulls the optional "Notes for Project Lead" off the form. The length
// is bounded by the upload form (Zod) and re-enforced by the backend (422).
function readNotes(formData: FormData): string | undefined {
  const notes = String(formData.get('notes') ?? '').trim()
  return notes || undefined
}

// parseUploadForm pulls the model file, cover image and answers out of the
// multipart form and validates them, keeping uploadDesign's own branching small.
export function parseUploadForm(formData: FormData): { value?: ParsedUpload; error?: string } {
  const files = readUploadFiles(formData)
  if (!files.file) return { error: files.error }

  const name = String(formData.get('name') ?? '').trim()
  if (!name) return { error: 'Give the design a name.' }

  const specs = DesignSpecsSchema.safeParse({
    material: formData.get('material'),
    colour: formData.get('colour') || undefined,
    finish: formData.get('finish'),
    units_per_bed: Number(formData.get('units_per_bed')),
    quality: formData.get('quality'),
    infill_pct: Number(formData.get('infill_pct')),
  })
  if (!specs.success) {
    return { error: specs.error.issues[0]?.message ?? 'Check the answers and try again.' }
  }
  const machine = parseMachineSpec(formData)
  if (!machine.value) return { error: machine.error }

  return {
    value: {
      name,
      specs: specs.data,
      machine: machine.value,
      file: files.file,
      preview: files.preview,
      previewUrl: files.previewUrl,
      notes: readNotes(formData),
      attributes: readAttributes(formData),
    },
  }
}
