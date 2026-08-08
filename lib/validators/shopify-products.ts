import { z } from 'zod'

// A brand's live Shopify catalog, mirroring Tensor-Core's
// /brands/:slug/shopify-products DTO. Fetched live from Shopify on every
// request - Tensor does not mirror products locally.

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
})
export type ShopifyProduct = z.infer<typeof ShopifyProductSchema>
