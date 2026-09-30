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

/**
 * One variable an uploaded .scad declares.
 *
 * The right-hand side of the mapping editor. Chosen from a list rather than
 * typed, because OpenSCAD accepts a `-D` naming a variable the script never
 * reads: a mapping written to NAME_1 instead of NAME_L renders a plank with
 * the name missing and exits 0, and nothing downstream can tell that from a
 * customer who left the field blank.
 */
export const TemplateParamSchema = z.object({
  name: z.string(),
  /** The customizer group header it sits under, or "" - these files declare
   *  about fifty variables and an ungrouped list of fifty is unchoosable. */
  section: z.string(),
  /** 'string' | 'number' | 'other' — 'other' is a vector, boolean or
   *  expression the parser would not guess the shape of. */
  type: z.string(),
  default: z.string(),
  /** The author's own trailing comment: the documentation these files have. */
  note: z.string(),
})

/**
 * A personalisation field customers have actually sent for this product.
 *
 * The left-hand side of the mapping editor, and the reason it is a dropdown:
 * the storefront's "STEP 4-First Name-:" normalises to "step 4 first name",
 * and a key typed one character wrong matches nothing in a way that looks
 * exactly like an order with no properties.
 */
export const ObservedPropertySchema = z.object({
  /** Normalised — what a mapping is matched by. */
  key: z.string(),
  /** The storefront's own wording, for recognising it. */
  label: z.string(),
  /** One real answer, which settles "name or number?" faster than any note. */
  sample: z.string(),
  /** How many recent orders carried it. One in two hundred is a retired
   *  option rather than something to map. */
  orders: z.number(),
})

export const FieldMapSchema = z.object({
  property_key: z.string(),
  scad_variable: z.string(),
  value_type: z.enum(['string', 'number']),
  /** Which design file this row feeds. 'body' for a product printing one. */
  role: z.string(),
  /** Whether an order that does not answer it holds the job. False means the
   *  variable is simply not passed and the template's default stands. */
  required: z.boolean(),
  /** A value that does not come from the order. Set on a row that says
   *  "always 200" rather than "whatever the customer typed". */
  fixed_value: z.string().nullish(),
  position: z.number(),
})

/**
 * One row of the mapping, as somebody edits it.
 *
 * `value_type` is not cosmetic: a string reaches OpenSCAD quoted and a number
 * bare. An unquoted string is a syntax error that fails the render loudly; a
 * quoted number is legal and silently means something else.
 */
export const FieldMapWriteSchema = z
  .object({
    property_key: z.string().trim().max(120),
    scad_variable: z.string().trim().min(1, 'Choose the variable it fills.').max(64),
    /**
     * A value that does not come from the order.
     *
     * The plank templates default OUT_X to 0 — "natural size, whatever the name
     * needs" — so without 200 here a combo's plank renders 377mm wide: the
     * wrong product, successfully.
     */
    fixed_value: z.string().trim().max(120).optional(),
    value_type: z.enum(['string', 'number']),
    /**
     * Absent means required, so the rule a product was configured under does not
     * change because a newer client stopped sending the flag.
     *
     * Optional matters: of the Soulmate Combos on record, two carry no rose name
     * at all. Under a required-everything rule those orders are held for a box
     * the customer chose to leave blank.
     */
    optional: z.boolean().optional(),
  })
  // One source or the other, matching the CHECK on the table. A row naming
  // neither leaves its variable unset, which OpenSCAD accepts in silence.
  .refine(r => (r.property_key ?? '') !== '' || (r.fixed_value ?? '') !== '', {
    message: 'Every row needs an order field or a fixed value.',
    path: ['property_key'],
  })

/**
 * One design file's whole mapping, saved at once — see `saveProductFieldMaps`.
 *
 * Scoped to a role on the way out as well as in: the backend clears and
 * rewrites what it is given, so a save that did not say which file it was
 * would delete the other files' mappings on the way past.
 */
export const FieldMapsWriteSchema = z.object({
  role: z.string().trim().min(1).max(24),
  maps: FieldMapWriteSchema.array(),
})

/**
 * Names the template one of a product's design files prints from.
 *
 * `role` is free text rather than the old body/base pair: a product may print
 * several things and they are called what they are - a plank, a rose, a
 * keychain. The database never restricted it; only the frontend did.
 */
export const ProductDesignWriteSchema = z.object({
  role: z
    .string()
    .trim()
    .min(1, 'Name this design file.')
    .max(24, 'Keep the name to 24 characters.'),
  template_key: z.string().trim().min(1, 'Name the template.').max(64),
})

/**
 * One of the things a product prints.
 *
 * Derived on the backend from the designs assigned to it, so a part exists
 * because a file was assigned to it and there is no second list to keep in
 * step.
 */
export const ProductPartSchema = z.object({
  role: z.string(),
  template_key: z.string(),
  fields: z.number(),
  required: z.number(),
  /** It has a file and at least one mapped field, so it can actually render. */
  ready: z.boolean(),
  /**
   * The files this product's SKUs disagree about for this part, when they do.
   *
   * DNP's six variants each print from one of three plank templates. The page
   * used to flatten that to "nothing prints this product yet", so the obvious
   * next click — choosing a file — silently overwrote all six.
   */
  conflicting: z.string().array().nullish(),
})

export const ImportProductSchema = z.object({
  shopify_product_id: z.string().trim().min(1, 'Choose a Shopify product.'),
  /** Blank means "use the code derived from the SKUs", which is right almost
   *  always — see the backend's productCodeFor. */
  code: z.string().trim().max(32).optional(),
  notes: z.string().trim().max(2000).nullish(),
})

export const ImportProductResultSchema = z.object({
  code: z.string(),
  name: z.string(),
  imported: z.number(),
  /** Variants Shopify carries with no SKU. Reported rather than hidden: they
   *  are colours no order can be matched to. */
  skipped: z.number(),
  /** Variants this import stopped matching, because Shopify dropped them. */
  retired: z.number(),
})

export type TemplateParam = z.infer<typeof TemplateParamSchema>
export type ObservedProperty = z.infer<typeof ObservedPropertySchema>
export type FieldMap = z.infer<typeof FieldMapSchema>
export type ProductPart = z.infer<typeof ProductPartSchema>
export type FieldMapWriteInput = z.infer<typeof FieldMapWriteSchema>
export type ProductDesignWriteInput = z.infer<typeof ProductDesignWriteSchema>
export type ImportProductInput = z.infer<typeof ImportProductSchema>
export type ImportProductResult = z.infer<typeof ImportProductResultSchema>

/**
 * One SKU and the slicer pipeline it prints with, per machine class.
 *
 * Keyed on the SKU string rather than a variant id, because the registry's
 * variants do not hold the SKUs that actually print — the live DNP variants
 * carry none at all — so the backend lists every SKU it can see: the
 * registry's, the ones on jobs, and the ones already mapped.
 */
export const SKUPipelineChoiceSchema = z.object({
  pipeline_id: z.number(),
  pipeline_name: z.string(),
  /** The mapped pipeline is gone from BambuBuddy; this bed would refuse to slice. */
  missing: z
    .boolean()
    .nullish()
    .transform(v => v ?? false),
})
export type SKUPipelineChoice = z.infer<typeof SKUPipelineChoiceSchema>

export const SKUPipelineRowSchema = z.object({
  sku: z.string(),
  product_code: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  product_name: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  /** Keyed by machine family: {"H2C": {...}}. Absent means the class default. */
  pipelines: z
    .record(z.string(), SKUPipelineChoiceSchema)
    .nullish()
    .transform(v => v ?? {}),
})
export type SKUPipelineRow = z.infer<typeof SKUPipelineRowSchema>

export const PipelineOptionSchema = z.object({
  id: z.number(),
  name: z.string(),
  /** The class this pipeline targets. A P2S one must not be offered for H2C. */
  machine_family: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
})
export type PipelineOption = z.infer<typeof PipelineOptionSchema>

export const SKUPipelinesSchema = z.object({
  skus: SKUPipelineRowSchema.array()
    .nullish()
    .transform(v => v ?? []),
  pipelines: PipelineOptionSchema.array()
    .nullish()
    .transform(v => v ?? []),
  families: z
    .string()
    .array()
    .nullish()
    .transform(v => v ?? []),
})
export type SKUPipelines = z.infer<typeof SKUPipelinesSchema>

export const SKUPipelineWriteSchema = z.object({
  sku: z.string().min(1).max(128),
  machine_family: z.string().min(1).max(16),
  /** Zero clears the mapping, returning the SKU to the class default. */
  pipeline_id: z.number().int().min(0),
})

export const SKUPipelineWriteInputSchema = z.object({
  mappings: SKUPipelineWriteSchema.array(),
})
export type SKUPipelineWriteInput = z.infer<typeof SKUPipelineWriteInputSchema>
