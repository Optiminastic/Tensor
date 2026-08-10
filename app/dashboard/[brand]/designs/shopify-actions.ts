'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import { createLogger } from '@/lib/logger'
import { type PublishResult } from '@/lib/validators/designs'
import {
  type ShopifyListingState,
  ShopifyListingEditSchema,
} from '@/lib/validators/shopify-listing'
import {
  editShopifyListing as editShopifyListingRequest,
  getShopifyListing as getShopifyListingRequest,
} from '@/services/designs-shopify.service'
import { DesignServiceError } from '@/services/designs.service'

import type { ActionResult } from './actions'

const log = createLogger('ShopifyListingActions')

function describe(error: unknown): string {
  if (error instanceof DesignServiceError) return error.message
  log.error({ err: error }, 'Unexpected error in a Shopify listing action')
  return 'Something went wrong. Please try again.'
}

// loadShopifyListing reads the design's live Shopify product so the edit dialog
// starts from the current values. The backend 409s if it isn't published yet.
export async function loadShopifyListing(id: string): Promise<ActionResult<ShopifyListingState>> {
  try {
    const { token, error } = await resolveBackendToken()
    if (!token) return { ok: false, error }
    const data = await getShopifyListingRequest(token, id)
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}

// Kept under next.config's serverActions.bodySizeLimit: 6 x 8MB = 48MB leaves
// headroom for the other form fields.
const MAX_LISTING_IMAGES = 6
const MAX_LISTING_IMAGE_BYTES = 8 * 1024 * 1024

interface UpdateShopifyListingArgs {
  input: unknown
  images?: File[]
  removeMediaIds?: string[]
}

// updateShopifyListing pushes edited fields (and an optional new price/status),
// image add/remove, and an optional stock quantity to an already-published
// product. The backend enforces shopify:publish and owns the Shopify write; the
// design's lifecycle status is unaffected.
export async function updateShopifyListing(
  brand: string,
  id: string,
  args: UpdateShopifyListingArgs,
): Promise<ActionResult<PublishResult>> {
  const parsed = ShopifyListingEditSchema.safeParse(args.input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Check the details and try again.',
    }
  }
  const images = args.images ?? []
  const imageError = validateListingImages(images)
  if (imageError) return { ok: false, error: imageError }

  let result: PublishResult
  try {
    const { token, error } = await resolveBackendToken()
    if (!token) return { ok: false, error }
    result = await editShopifyListingRequest(token, id, {
      input: parsed.data,
      images,
      removeMediaIds: args.removeMediaIds ?? [],
    })
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
  try {
    revalidatePath(`/dashboard/${brand}/designs/${id}`)
  } catch {
    // Best effort; the write already succeeded.
  }
  return { ok: true, data: result }
}

// validateListingImages re-checks the added files server-side (a client is not
// trusted): the count, per-file size, and that each is an image.
function validateListingImages(images: File[]): string | null {
  if (images.length > MAX_LISTING_IMAGES) {
    return `At most ${MAX_LISTING_IMAGES} images can be added at once.`
  }
  for (const image of images) {
    if (!image.type.startsWith('image/')) return 'Only image files can be attached.'
    if (image.size > MAX_LISTING_IMAGE_BYTES) return 'Each image must be under 8 MB.'
  }
  return null
}
