import { z } from 'zod'

/**
 * The units the shelf counts in.
 *
 * Mirrors inventoryUnits in the backend (internal/httpapi/inventory_items.go),
 * which rejects anything else. A fixed list rather than a free-text box because
 * "pcs", "pieces", "Piece" and "piece" are one unit typed four ways, and a shelf
 * that reports two of them as different things is worse than one that refuses
 * the fourth spelling.
 */
export const INVENTORY_UNITS = [
  'unit',
  'piece',
  'pair',
  'pack',
  'box',
  'sheet',
  'roll',
  'kg',
  'g',
  'litre',
  'ml',
  'metre',
] as const

export type InventoryUnit = (typeof INVENTORY_UNITS)[number]

export const InventoryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number(),
  unit: z.string(),
  // Null means nobody has recorded a price, which is different from free.
  unit_price: z.number().nullable(),
  // The stable handle a bill of materials points at, so a BOM line survives the
  // shelf being renamed. Null until the part is used by a product.
  code: z.string().nullish(),
  /**
   * 'bought' arrives from a supplier; 'printed' the shop makes itself.
   *
   * A printed component is a part of a product nobody personalises - the diya
   * holder, the red heart, the box a lit plank sits in. It is an inventory
   * item rather than a design file because one is shared by every colourway
   * and several products, while a design file belongs to one product.
   *
   * Nullish so an older backend that does not send it reads as bought, which
   * is what every row was before this existed.
   */
  source: z
    .string()
    .nullish()
    .transform(v => v ?? 'bought'),
  /** The .scad it prints from, when it is parameterised. */
  template_key: z.string().nullish(),
  /** Its own uploaded mesh, which is the usual case. */
  model_file_id: z.string().nullish(),
  /** The Shopify product this component is a part of, if it names one. */
  shopify_product_gid: z.string().nullish(),
  /**
   * That product's name, snapshotted when it was chosen.
   *
   * Stored rather than resolved so the registry's picker can say what a part
   * belongs to without a live Shopify call on every page load. It goes stale
   * if the product is renamed there, which is the trade.
   */
  shopify_product_title: z.string().nullish(),
  /**
   * 'shared' - one set of files for every SKU, for a part that does not change
   * with the colourway. 'per_sku' - one set each.
   *
   * Nullish so an older backend reads as per_sku, which is what every row
   * written before this existed means.
   */
  plate_scope: z
    .string()
    .nullish()
    .transform(v => v ?? 'per_sku'),
  created_at: z.string(),
  updated_at: z.string(),
})

export type InventoryItem = z.infer<typeof InventoryItemSchema>

/** How a component is made. */
export const COMPONENT_SOURCES = ['bought', 'printed'] as const
export type ComponentSource = (typeof COMPONENT_SOURCES)[number]

/**
 * Declaring how a component is made, and what prints it.
 *
 * Separate from NewInventoryItemSchema because it is a separate endpoint with
 * a different guard: the shelf is filament:manage, binding a design file to a
 * part is registry:manage.
 */
export const ComponentSourceWriteSchema = z.object({
  source: z.enum(COMPONENT_SOURCES),
  template_key: z.string().trim().max(64).optional(),
  model_file_id: z.string().trim().optional(),
  /** The Shopify product this component is a part of. */
  shopify_product_gid: z.string().trim().optional(),
  plate_scope: z.enum(['shared', 'per_sku']).optional(),
  shopify_product_title: z.string().trim().max(255).optional(),
})

/** Whether one set of print files serves every SKU, or each needs its own. */
export const PLATE_SCOPES = ['shared', 'per_sku'] as const
export type PlateScope = (typeof PLATE_SCOPES)[number]

export type ComponentSourceWriteInput = z.infer<typeof ComponentSourceWriteSchema>

/** What a component is, after declaring how it is made. */
export const ComponentSchema = z.object({
  id: z.string(),
  name: z.string(),
  source: z.string(),
  template_key: z.string(),
  model_file_id: z.string(),
  model_filename: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
})

export type Component = z.infer<typeof ComponentSchema>

/**
 * One SKU's ready-made plate on one machine class.
 *
 * Addressed by both because a sliced file has the filament baked into it: the
 * purple plate is not the red one, so a three-colourway product carries nine
 * files rather than three.
 */
export const ComponentPlateSchema = z.object({
  sku: z.string(),
  machine_family: z.string(),
  filename: z.string(),
  size_bytes: z.number(),
  uploaded_by: z.string(),
  file_id: z.string(),
})

export type ComponentPlate = z.infer<typeof ComponentPlateSchema>

export const ComponentPlatesResponseSchema = z.object({
  items: ComponentPlateSchema.array(),
})

export const InventoryItemListSchema = InventoryItemSchema.array()

export const NewInventoryItemSchema = z.object({
  name: z.string().trim().min(1, 'Give the item a name.'),
  quantity: z.number().nonnegative('A quantity cannot be negative.'),
  unit: z.enum(INVENTORY_UNITS),
  unit_price: z.number().nonnegative('A price cannot be negative.').nullable(),
  // Optional, and omitted entirely by the Inventory dialog. The backend
  // COALESCEs an absent code, so restocking a part never clears the handle a
  // BOM points at.
  code: z.string().trim().max(64, 'A part code is at most 64 characters.').nullish(),
})

export type NewInventoryItem = z.infer<typeof NewInventoryItemSchema>
