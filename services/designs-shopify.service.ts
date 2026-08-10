// Server-only by placement. The edit-an-already-published-product calls, split
// from designs.service.ts to keep that file within the line budget. Reuses that
// module's shared `call` + header helpers so the transport stays in one place.
import { type PublishResult, PublishResultSchema } from '@/lib/validators/designs'
import {
  type ShopifyListingEdit,
  type ShopifyListingState,
  ShopifyListingStateSchema,
} from '@/lib/validators/shopify-listing'
import { authHeader, call, jsonHeaders } from '@/services/designs.service'

// Reads the design's live Shopify product to prefill an edit. The backend 409s
// when the design isn't published yet; enforces shopify:publish + brand access.
export async function getShopifyListing(token: string, id: string): Promise<ShopifyListingState> {
  return call(
    `/designs/${encodeURIComponent(id)}/shopify-product`,
    { headers: jsonHeaders(token) },
    data => ShopifyListingStateSchema.parse(data),
  )
}

export interface EditShopifyListingParams {
  input: ShopifyListingEdit
  images: File[]
  removeMediaIds: string[]
}

// Pushes merchant-facing edits (fields, price, status), image add/remove, and an
// optional stock quantity to the design's already-published Shopify product.
// Sends multipart/form-data so new image files ride along; Content-Type is left
// unset so fetch adds the boundary. Enforces shopify:publish + brand access.
export async function editShopifyListing(
  token: string,
  id: string,
  { input, images, removeMediaIds }: EditShopifyListingParams,
): Promise<PublishResult> {
  const form = new FormData()
  form.set('title', input.title)
  form.set('description', input.description)
  form.set('product_type', input.product_type)
  form.set('vendor', input.vendor)
  form.set('status', input.status)
  form.set('seo_title', input.seo_title)
  form.set('seo_description', input.seo_description)
  form.set('tags', input.tags.join(', '))
  if (input.price !== undefined) form.set('price', String(input.price))
  if (input.inventory_quantity !== undefined) {
    form.set('inventory_quantity', String(input.inventory_quantity))
  }
  for (const mediaId of removeMediaIds) form.append('remove_media', mediaId)
  for (const image of images) form.append('images', image, image.name)

  return call(
    `/designs/${encodeURIComponent(id)}/shopify-product`,
    { method: 'PATCH', headers: authHeader(token), body: form },
    data => PublishResultSchema.parse(data),
  )
}
