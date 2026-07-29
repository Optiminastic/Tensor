'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import { createLogger } from '@/lib/logger'
import {
  type Design,
  type DesignDetail,
  type DesignSpecs,
  type PublishResult,
  DesignSpecsSchema,
  PublishInputSchema,
} from '@/lib/validators/designs'
import {
  DesignServiceError,
  createDesign,
  getDesign,
  publishToShopify,
  resubmitDesign as resubmitRequest,
} from '@/services/designs.service'

const log = createLogger('DesignActions')

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export interface ActionResult<T = undefined> {
  ok: boolean
  error?: string
  data?: T
}

function describe(error: unknown): string {
  if (error instanceof DesignServiceError) return error.message
  log.error({ err: error }, 'Unexpected error in a design action')
  return 'Something went wrong. Please try again.'
}

interface ParsedUpload {
  name: string
  specs: DesignSpecs
  file: File
}

// parseUploadForm pulls the model file and answers out of the multipart form and
// validates them, keeping uploadDesign's own branching small.
function parseUploadForm(formData: FormData): { value?: ParsedUpload; error?: string } {
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choose an STL, 3MF or STEP file.' }
  }
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
  return { value: { name, specs: specs.data, file } }
}

// uploadDesign receives the multipart form: the answers plus the model file. The
// brand comes from the route, not the form, and identity is re-resolved here.
export async function uploadDesign(
  brand: string,
  formData: FormData,
): Promise<ActionResult<Design>> {
  if (!SLUG_PATTERN.test(brand)) return { ok: false, error: 'Invalid brand.' }

  const parsed = parseUploadForm(formData)
  if (!parsed.value) return { ok: false, error: parsed.error }

  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }

  try {
    const design = await createDesign(token, { brand, ...parsed.value })
    revalidatePath(`/dashboard/${brand}/designs`)
    return { ok: true, data: design }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}

// resubmitDesign re-slices an existing design with new answers, reusing its
// uploaded model. This is the "fix and try again" step of the green loop.
export async function resubmitDesign(
  brand: string,
  id: string,
  input: unknown,
): Promise<ActionResult<Design>> {
  const specs = DesignSpecsSchema.safeParse(input)
  if (!specs.success) {
    return {
      ok: false,
      error: specs.error.issues[0]?.message ?? 'Check the answers and try again.',
    }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }

  try {
    const design = await resubmitRequest(token, id, specs.data)
    revalidatePath(`/dashboard/${brand}/designs/${id}`)
    return { ok: true, data: design }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}

// approveAndPublish approves a priced design and creates its Shopify draft in one
// step. The backend enforces shopify:publish; a not-connected brand returns a
// friendly error and leaves the design approved (retryable).
// Kept under next.config's serverActions.bodySizeLimit (64mb): 6 x 8MB = 48MB
// leaves headroom for the other form fields.
const MAX_PUBLISH_IMAGES = 6
const MAX_PUBLISH_IMAGE_BYTES = 8 * 1024 * 1024

interface ApprovePublishArgs {
  input: unknown
  images?: File[]
}

export async function approveAndPublish(
  brand: string,
  id: string,
  args: ApprovePublishArgs,
): Promise<ActionResult<PublishResult>> {
  const parsed = PublishInputSchema.safeParse(args.input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Check the details and try again.',
    }
  }
  const images = args.images ?? []
  const imageError = validateImages(images)
  if (imageError) return { ok: false, error: imageError }

  // Token resolution is inside the boundary: its auth calls can reject, and the
  // caller only handles ActionResult, not a thrown error.
  let result: PublishResult
  try {
    const { token, error } = await resolveBackendToken()
    if (!token) return { ok: false, error }
    result = await publishToShopify(token, { id, input: parsed.data, images })
  } catch (err) {
    return { ok: false, error: describe(err) }
  }

  // The Shopify draft is created; a cache-revalidation failure must not report
  // the publish as failed and invite a duplicate retry.
  try {
    revalidatePath(`/dashboard/${brand}/designs/${id}`)
  } catch {
    // Best effort; the write already succeeded.
  }
  return { ok: true, data: result }
}

// validateImages re-checks the files server-side (a client is not trusted): the
// count, per-file size, and that each is an image. Returns an error message or null.
function validateImages(images: File[]): string | null {
  if (images.length > MAX_PUBLISH_IMAGES) {
    return `At most ${MAX_PUBLISH_IMAGES} images can be attached.`
  }
  for (const image of images) {
    if (!image.type.startsWith('image/')) return 'Only image files can be attached.'
    if (image.size > MAX_PUBLISH_IMAGE_BYTES) return 'Each image must be under 20 MB.'
  }
  return null
}

// fetchDesignDetail backs the detail page's client-side polling through the
// slice -> price loop.
export async function fetchDesignDetail(id: string): Promise<ActionResult<DesignDetail>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }

  try {
    const design = await getDesign(token, id)
    return { ok: true, data: design }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}
