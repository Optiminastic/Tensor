import { z } from 'zod'

/** Which inventory shelf a custom column belongs to. */
export const InventoryShelfSchema = z.enum(['filament', 'items'])
export type InventoryShelf = z.infer<typeof InventoryShelfSchema>

/**
 * A column the shop added to a shelf. A row keeps its value for it in its own
 * `extra`, keyed by `name`.
 */
export const InventoryColumnSchema = z.object({
  id: z.string(),
  shelf: InventoryShelfSchema,
  name: z.string(),
  position: z.number(),
})
export type InventoryColumn = z.infer<typeof InventoryColumnSchema>

export const InventoryColumnListSchema = z.array(InventoryColumnSchema)

export const AddInventoryColumnSchema = z.object({
  shelf: InventoryShelfSchema,
  name: z.string().trim().min(1, 'Give the column a name.').max(64),
})

export const SetInventoryExtraSchema = z.object({
  shelf: InventoryShelfSchema,
  rowId: z.string().uuid(),
  column: z.string().min(1).max(64),
  value: z.string().max(500),
})
export type SetInventoryExtraInput = z.infer<typeof SetInventoryExtraSchema>

/** Several custom values on one row, saved together - the Edit form. */
export const SetInventoryExtrasSchema = z.object({
  shelf: InventoryShelfSchema,
  rowId: z.string().uuid(),
  values: z.record(
    z.string().min(1).max(64),
    z.string().max(500, 'A value is at most 500 characters.'),
  ),
})
export type SetInventoryExtrasInput = z.infer<typeof SetInventoryExtrasSchema>
