import { z } from 'zod'

/**
 * Bulk orders and the quotations they produce.
 *
 * Mirrors internal/httpapi/bulk_orders.go. Note what the WRITE schema does not
 * carry: no unit price, no line total, no subtotal, no grand total. Those are
 * computed by Tensor-Core from the SKUs, the quantities and the discount
 * percent, because a server action's arguments are client-controlled and a
 * total accepted from the browser is a total a customer can choose.
 */

/** Where a quotation is in its life. Matches the backend's CHECK constraint. */
export const BULK_ORDER_STATUSES = ['draft', 'sent', 'accepted', 'cancelled'] as const
export const BulkOrderStatusSchema = z.enum(BULK_ORDER_STATUSES)
export type BulkOrderStatus = z.infer<typeof BulkOrderStatusSchema>

/** YYYY-MM-DD, which is what the backend parses and what <input type="date"> emits. */
const DateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the date picker')

/** One product on a quotation, as the backend returns it. */
export const BulkOrderLineSchema = z.object({
  id: z.string(),
  variant_id: z.string().nullable(),
  sku: z.string(),
  product_name: z.string(),
  quantity: z.number().int(),
  unit_price: z.number(),
  line_total: z.number(),
})

export const BulkOrderSchema = z.object({
  id: z.string(),
  quotation_number: z.string(),
  brand_slug: z.string(),
  customer_name: z.string(),
  customer_email: z.string().nullable(),
  customer_phone: z.string().nullable(),
  notes: z.string().nullable(),
  order_date: z.string(),
  valid_until: z.string().nullable(),
  status: BulkOrderStatusSchema,
  discount_percent: z.number(),
  subtotal: z.number(),
  discount_amount: z.number(),
  total: z.number(),
  currency: z.string(),
  lines: z.array(BulkOrderLineSchema),
  created_at: z.string(),
  updated_at: z.string(),
})

export const BulkOrderListSchema = z.array(BulkOrderSchema)

/**
 * A product that may go on a line: every Shopify variant carrying a SKU.
 *
 * unit_price is nullable on purpose: Shopify has the SKU but no price on it. The form shows that rather than hiding the option,
 * because an operator needs to see the gap before sending a quotation. The
 * backend refuses such a line by name, so this is a warning, not a second
 * enforcement.
 */
export const SellableSkuSchema = z.object({
  // The registry variant this SKU maps to, when there is one. Null for the many
  // Shopify SKUs the registry has never needed - a bulk order may quote
  // anything the shop sells, not only what Tensor produces.
  variant_id: z.string().nullable(),
  sku: z.string(),
  product_name: z.string(),
  // The product this variant belongs to, used to group the dropdown.
  group: z.string(),
  product_code: z.string(),
  unit_price: z.number().nullable(),
})
export const SellableSkuListSchema = z.array(SellableSkuSchema)

/** One line as the form submits it: what, and how many. */
export const BulkOrderLineInputSchema = z.object({
  sku: z.string().min(1, 'Choose a product'),
  quantity: z.coerce.number().int().positive('At least one'),
})

export const BulkOrderInputSchema = z.object({
  customer_name: z.string().min(1, 'Who is ordering?'),
  customer_email: z.string().email('Check the email address').or(z.literal('')),
  customer_phone: z.string(),
  notes: z.string(),
  order_date: DateStringSchema,
  // Blank is allowed: a quotation need not expire.
  valid_until: DateStringSchema.or(z.literal('')),
  status: BulkOrderStatusSchema,
  discount_percent: z.coerce.number().min(0, 'Cannot be negative').max(100, 'Cannot exceed 100%'),
  lines: z.array(BulkOrderLineInputSchema).min(1, 'Add at least one product'),
})

export type BulkOrder = z.infer<typeof BulkOrderSchema>
export type BulkOrderLine = z.infer<typeof BulkOrderLineSchema>
export type SellableSku = z.infer<typeof SellableSkuSchema>
export type BulkOrderInput = z.infer<typeof BulkOrderInputSchema>
export type BulkOrderLineInput = z.infer<typeof BulkOrderLineInputSchema>
