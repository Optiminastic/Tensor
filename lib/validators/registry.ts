import { z } from 'zod'

/**
 * The product registry: what a product IS, as against what happened to one.
 *
 * Mirrors Tensor-Core's /registry DTOs. A variant is a COMBINATION of option
 * values rather than a product of its own - the storefront already sells 41
 * distinct product names for what is really one plank times colour times light,
 * and modelling that as 41 products is how the next colour becomes 82.
 */
export const OptionValueSchema = z.object({
  id: z.string(),
  code: z.string(),
  label: z.string(),
})

export const ProductOptionSchema = z.object({
  id: z.string(),
  code: z.string(),
  label: z.string(),
  values: OptionValueSchema.array(),
})

export const BomLineSchema = z.object({
  item_id: z.string(),
  item_code: z.string().nullish(),
  item_name: z.string(),
  unit: z.string(),
  quantity: z.number(),
  // Null when nobody has recorded a price, which is different from free - a BOM
  // that totalled unknown prices as zero would understate every product that
  // carries that part.
  unit_price: z.number().nullish(),
  line_cost: z.number().nullish(),
  // Absent on the product-detail path, which is answering "what is this made
  // of" rather than "can we build it today". The dedicated BOM endpoint sends
  // it; nullish here so one schema serves both without inventing a zero.
  in_stock: z.number().nullish(),
})

export const VariantDesignSchema = z.object({
  role: z.string(),
  template_key: z.string().nullish(),
  design_id: z.string().nullish(),
  version: z.number(),
})

export const RegistryVariantSchema = z.object({
  id: z.string(),
  // Null is normal: nine live plank lines carry no SKU and are matched by name.
  sku: z.string().nullish(),
  name: z.string(),
  status: z.string(),
  /** "heart_count=2,light=wired" - what this variant IS. */
  options: z.string(),
  part_count: z.number(),
  // Carried with the variant so a row can be expanded without another request.
  parts: BomLineSchema.array().nullish(),
  design: VariantDesignSchema.nullish(),
  // Null when any part has no recorded price: a total that treated unknown as
  // zero would read as a real figure.
  parts_cost: z.number().nullish(),
})

/**
 * A design template, and where the renderer reads it from.
 *
 * "embedded" means it still comes from the compiled binary and can only be
 * changed by a deploy; "uploaded" means somebody has replaced it and that file
 * is what prints. That distinction is the whole reason it is shown.
 */
export const DesignTemplateSchema = z.object({
  key: z.string(),
  version: z.number(),
  filename: z.string(),
  size_bytes: z.number(),
  uploaded_by: z.string(),
  notes: z.string().nullish(),
  created_at: z.string(),
  source: z.string(),
})

export type DesignTemplate = z.infer<typeof DesignTemplateSchema>

export const RegistryProductSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  /** 'generated' - Tensor renders it. 'uploaded' - somebody supplies a 3MF. */
  kind: z.string(),
  status: z.string(),
  notes: z.string().nullish(),
  option_count: z.number(),
  variant_count: z.number(),
})

export const RegistryProductDetailSchema = RegistryProductSchema.extend({
  options: ProductOptionSchema.array(),
  variants: RegistryVariantSchema.array(),
  // The files this product's variants print from. Nullish so an older backend
  // that does not send them renders the product rather than failing the page.
  designs: DesignTemplateSchema.array().nullish(),
})

/** What a product IS, as somebody types it. */
export const PRODUCT_KINDS = ['generated', 'uploaded'] as const
export const PRODUCT_STATUSES = ['active', 'retired'] as const

export const ProductWriteSchema = z.object({
  // Upper-cased on the server too: the code is the segment an order's SKU
  // carries, and one registered as "dnp" would silently match nothing.
  code: z
    .string()
    .trim()
    .min(1, 'Give the product a code.')
    .max(32, 'Keep the code to 32 characters.'),
  name: z
    .string()
    .trim()
    .min(1, 'Give the product a name.')
    .max(160, 'Keep the name to 160 characters.'),
  kind: z.enum(PRODUCT_KINDS),
  status: z.enum(PRODUCT_STATUSES),
  notes: z.string().trim().max(2000).nullish(),
})

export type ProductKind = (typeof PRODUCT_KINDS)[number]
export type ProductStatus = (typeof PRODUCT_STATUSES)[number]
export type ProductWriteInput = z.infer<typeof ProductWriteSchema>

/** One axis of choice on a product: heart_count, light, colour. */
export const OptionWriteSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Give the option a code.')
    .max(32, 'Keep the code to 32 characters.'),
  label: z
    .string()
    .trim()
    .min(1, 'Give the option a label.')
    .max(80, 'Keep the label to 80 characters.'),
  position: z.number().int().min(0).default(0),
})

/** One allowed answer on an axis. */
export const OptionValueWriteSchema = z.object({
  code: z.string().trim().min(1, 'Give the value a code.').max(48),
  label: z.string().trim().min(1, 'Give the value a label.').max(80),
  position: z.number().int().min(0).default(0),
})

/**
 * One sellable combination.
 *
 * `option_value_ids` is the WHOLE set, never a delta - a variant IS its option
 * values, so a partial write would leave one that is "2 hearts" and nothing
 * else, matching no order and reading as blank.
 */
export const VariantWriteSchema = z.object({
  name: z.string().trim().min(1, 'Give the variant a name.').max(200),
  // Blank stays null, not "": nine live plank lines carry no SKU, and an empty
  // string would collide with every other blank under the unique index.
  sku: z.string().trim().max(128).nullish(),
  status: z.enum(PRODUCT_STATUSES),
  option_value_ids: z.string().array(),
})

/** 'body' is the product itself; 'base' is the light box it sits on. */
export const DESIGN_ROLES = ['body', 'base'] as const

export const VariantDesignWriteSchema = z.object({
  role: z.enum(DESIGN_ROLES),
  template_key: z.string().trim().max(64).nullish(),
  design_id: z.string().trim().nullish(),
})

export type OptionWriteInput = z.infer<typeof OptionWriteSchema>
export type OptionValueWriteInput = z.infer<typeof OptionValueWriteSchema>
export type VariantWriteInput = z.infer<typeof VariantWriteSchema>
export type VariantDesignWriteInput = z.infer<typeof VariantDesignWriteSchema>
export type DesignRole = (typeof DESIGN_ROLES)[number]

export type OptionValue = z.infer<typeof OptionValueSchema>
export type ProductOption = z.infer<typeof ProductOptionSchema>
export type RegistryVariant = z.infer<typeof RegistryVariantSchema>
export type RegistryProduct = z.infer<typeof RegistryProductSchema>
export type RegistryProductDetail = z.infer<typeof RegistryProductDetailSchema>
export type BomLine = z.infer<typeof BomLineSchema>
