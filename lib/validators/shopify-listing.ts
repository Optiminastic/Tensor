import { z } from 'zod'

// Validators for editing an already-published Shopify listing. Split from
// designs.ts to keep that file within the line budget.

// The status a merchant can set on an already-published Shopify product. These
// map one-to-one to Shopify's ProductStatus (ACTIVE / DRAFT / ARCHIVED).
export const ShopifyListingStatusSchema = z.enum(['active', 'draft', 'archived'])
export type ShopifyListingStatus = z.infer<typeof ShopifyListingStatusSchema>

// One image currently on the listing: its Shopify media id (to remove it) and URL.
export const ShopifyListingImageSchema = z.object({
  id: z.string(),
  url: z.string(),
})
export type ShopifyListingImage = z.infer<typeof ShopifyListingImageSchema>

// The live state of an already-published product, read from Shopify to prefill
// the edit form (GET /designs/:id/shopify-product). description is plain text
// (the backend renders the stored HTML back down), price is whole INR.
export const ShopifyListingStateSchema = z.object({
  product_gid: z.string(),
  handle: z.string(),
  admin_url: z.string(),
  status: ShopifyListingStatusSchema,
  title: z.string(),
  description: z.string(),
  product_type: z.string(),
  vendor: z.string(),
  tags: z.string().array(),
  seo_title: z.string(),
  seo_description: z.string(),
  price: z.number().int(),
  sku: z.string(),
  // Current on-hand stock across the store, and the live image gallery. Defaulted
  // so a backend that predates these fields still parses.
  inventory_quantity: z.number().int().default(0),
  images: ShopifyListingImageSchema.array().default([]),
})
export type ShopifyListingState = z.infer<typeof ShopifyListingStateSchema>

// The edit pushed to an already-published product (PATCH /designs/:id/shopify-product).
// Title is required; an omitted price leaves the variant price unchanged, an
// omitted inventory quantity leaves stock untouched. The backend re-validates and
// owns the push to Shopify.
export const ShopifyListingEditSchema = z.object({
  title: z.string().min(1, 'Give the product a title').max(255),
  description: z.string().max(50_000),
  product_type: z.string().max(255),
  vendor: z.string().max(255),
  tags: z.string().array(),
  status: ShopifyListingStatusSchema,
  seo_title: z.string().max(255),
  seo_description: z.string().max(320),
  price: z.number().int().positive().optional(),
  inventory_quantity: z.number().int().nonnegative().max(1_000_000).optional(),
})
export type ShopifyListingEdit = z.infer<typeof ShopifyListingEditSchema>
