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
  created_at: z.string(),
  updated_at: z.string(),
})

export type InventoryItem = z.infer<typeof InventoryItemSchema>

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
