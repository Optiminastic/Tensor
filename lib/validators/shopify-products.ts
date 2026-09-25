import { z } from 'zod'

// A brand's live Shopify catalog, mirroring Tensor-Core's
// /brands/:slug/shopify-products DTO. Fetched live from Shopify on every
// request - Tensor does not mirror products locally.

/**
 * One sellable variant, and the SKU that identifies it.
 *
 * The SKU is why the registry cares about this list at all: it is what an
 * order carries and the only thing a job can be matched to a product by. A
 * variant with none is shown rather than hidden - it is a colour no order can
 * ever reach, which is a thing to go and fix in Shopify.
 */
export const ShopifyVariantSchema = z.object({
  id: z.string(),
  title: z.string(),
  sku: z.string(),
})

export const ShopifyProductSchema = z.object({
  id: z.string(),
  title: z.string(),
  handle: z.string(),
  status: z.string(),
  vendor: z.string(),
  product_type: z.string(),
  total_inventory: z.number(),
  image_url: z.string(),
  image_alt: z.string(),
  min_price: z.string(),
  max_price: z.string(),
  currency_code: z.string(),
  updated_at: z.string(),
  admin_url: z.string(),
  // Nullish so an older backend that does not send them renders the catalogue
  // rather than failing the page it is the whole content of.
  variants: ShopifyVariantSchema.array().nullish(),
})
export type ShopifyProduct = z.infer<typeof ShopifyProductSchema>
export type ShopifyVariant = z.infer<typeof ShopifyVariantSchema>
