'use server'

import { revalidatePath } from 'next/cache'

import { getUserDirectory } from '@/lib/auth'
import { resolveBackendToken } from '@/lib/backend-token'
import { createLogger } from '@/lib/logger'
import {
  type Design,
  type DesignDetail,
  type DesignReview,
  type DesignSpecs,
  type DesignTimelineEntry,
  type PublishResult,
  DesignSkuInputSchema,
  DesignSpecsSchema,
  PublishInputSchema,
  ResubmitInputSchema,
} from '@/lib/validators/designs'
import type { Machine } from '@/lib/validators/machines'
import {
  DesignServiceError,
  approveDesign as approveRequest,
  commentOnDesign as commentRequest,
  createDesign,
  getDesign,
  listDesignReviews as listReviewsRequest,
  publishToShopify,
  rejectDesign as rejectRequest,
  resubmitDesign as resubmitRequest,
  setDesignSku as setSkuRequest,
  submitDesign as submitRequest,
} from '@/services/designs.service'
import { MachineServiceError, listMachines } from '@/services/machines.service'

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
  preview: File
  notes?: string
}

// readUploadFiles validates the two required uploads (model + preview image).
function readUploadFiles(formData: FormData): { file?: File; preview?: File; error?: string } {
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choose an STL, 3MF or STEP file.' }
  }
  const preview = formData.get('preview')
  if (!(preview instanceof File) || preview.size === 0) {
    return { error: 'Upload a preview image for the design.' }
  }
  return { file, preview }
}

// parseUploadForm pulls the model file, preview image and answers out of the
// multipart form and validates them, keeping uploadDesign's own branching small.
function parseUploadForm(formData: FormData): { value?: ParsedUpload; error?: string } {
  const files = readUploadFiles(formData)
  if (!files.file || !files.preview) return { error: files.error }

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
  return {
    value: {
      name,
      specs: specs.data,
      file: files.file,
      preview: files.preview,
      notes: readNotes(formData),
    },
  }
}

// readNotes pulls the optional "Notes for Project Lead" off the form. The length
// is bounded by the upload form (Zod) and re-enforced by the backend (422).
function readNotes(formData: FormData): string | undefined {
  const notes = String(formData.get('notes') ?? '').trim()
  return notes || undefined
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

// fetchMachines lists the machines a design can be sliced on (name + slicing
// config, no cost). Designers have machine:read for exactly this picker.
export async function fetchMachines(): Promise<ActionResult<Machine[]>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const machines = await listMachines(token)
    return { ok: true, data: machines }
  } catch (err) {
    const message = err instanceof MachineServiceError ? err.message : 'Could not load machines.'
    return { ok: false, error: message }
  }
}

// resliceWithSettings re-slices a design with the studio's advanced overrides
// (layer height, walls, infill pattern, supports) alongside its spec answers. The
// backend re-clamps every value; the frontend bounds are UX only.
export async function resliceWithSettings(
  brand: string,
  id: string,
  input: unknown,
): Promise<ActionResult<Design>> {
  const parsed = ResubmitInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Check the settings and try again.',
    }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }

  try {
    const design = await resubmitRequest(token, id, parsed.data)
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

// --- Review workflow ----------------------------------------------------------

// submitForReview sends a priced Green/Yellow design to the Project Lead. The
// backend enforces design:submit and the Green/Yellow gate.
export async function submitForReview(
  brand: string,
  id: string,
  message?: string,
): Promise<ActionResult<Design>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const design = await submitRequest(token, id, message)
    revalidatePath(`/dashboard/${brand}/designs/${id}`)
    return { ok: true, data: design }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}

// approveDesignForBrand locks the SP and approves a submitted design (design:approve).
export async function approveDesignForBrand(
  brand: string,
  id: string,
): Promise<ActionResult<Design>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const design = await approveRequest(token, id)
    revalidatePath(`/dashboard/${brand}/designs/${id}`)
    return { ok: true, data: design }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}

// setDesignSkuForBrand assigns (or clears) the design's catalog SKU. Guarded by
// shopify:publish in the backend; the frontend only hides the control. An empty
// string clears the SKU.
export async function setDesignSkuForBrand(
  brand: string,
  id: string,
  input: unknown,
): Promise<ActionResult<Design>> {
  const parsed = DesignSkuInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Enter a valid SKU.' }
  }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const design = await setSkuRequest(token, id, parsed.data.sku)
    revalidatePath(`/dashboard/${brand}/designs/${id}`)
    return { ok: true, data: design }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}

// rejectDesignForBrand sends a submitted design back with a required comment
// (design:reject).
export async function rejectDesignForBrand(
  brand: string,
  id: string,
  comment: string,
): Promise<ActionResult<Design>> {
  if (comment.trim().length === 0)
    return { ok: false, error: 'A comment is required to send back.' }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const design = await rejectRequest(token, id, comment)
    revalidatePath(`/dashboard/${brand}/designs/${id}`)
    return { ok: true, data: design }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}

// addDesignComment posts a freeform comment to the review thread (design:read).
export async function addDesignComment(
  id: string,
  body: string,
): Promise<ActionResult<DesignReview>> {
  if (body.trim().length === 0) return { ok: false, error: 'Write a comment first.' }
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const review = await commentRequest(token, id, body)
    return { ok: true, data: review }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}

// fetchDesignReviews backs the timeline's client-side query. It enriches each
// backend review with its author's display identity (name + email), resolved
// here from Better Auth's user table so the timeline can show "who did what".
export async function fetchDesignReviews(id: string): Promise<ActionResult<DesignTimelineEntry[]>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }
  try {
    const reviews = await listReviewsRequest(token, id)
    const directory = await getUserDirectory(reviews.map(review => review.author_id))
    const entries = reviews.map<DesignTimelineEntry>(review => {
      const author = directory.get(review.author_id)
      return { ...review, author_name: author?.name ?? null, author_email: author?.email ?? null }
    })
    return { ok: true, data: entries }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}
