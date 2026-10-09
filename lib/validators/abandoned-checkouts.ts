import { z } from 'zod'

/**
 * A checkout the customer started and walked away from.
 *
 * Shopify's definition, not ours: a checkout only becomes "abandoned" once the
 * customer entered contact details, so this list is always far shorter than
 * "carts that did not convert". Everyone who bounced before that step is in the
 * storefront's analytics, not in this API.
 *
 * There is no email. `AbandonedCheckout` has no such field, and the linked
 * customer record needs the `read_customers` scope this app does not hold - so
 * the name and phone come off the billing address, which `read_orders` covers.
 */
export const AbandonedLineItemSchema = z.object({
  title: z.string(),
  variant_title: z.string(),
  sku: z.string(),
  quantity: z.number(),
})

export const AbandonedCheckoutSchema = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.string(),
  /** Restores the customer's exact basket - the one genuinely actionable field. */
  recovery_url: z.string(),
  /** Either may be blank: a customer can reach the contact step with an email only. */
  customer_name: z.string(),
  phone: z.string(),
  city: z.string(),
  province: z.string(),
  total_amount: z.string(),
  currency: z.string(),
  item_count: z.number(),
  line_items: z.array(AbandonedLineItemSchema).default([]),
  /**
   * Set once the buyer finished the checkout after all; null while still open.
   *
   * Shopify keeps recovered checkouts in this list rather than removing them,
   * and they convert later than you would guess - one on this store six days
   * after it was abandoned. Without this, every one of those rows offers to
   * ring a customer about a basket they already paid for.
   */
  completed_at: z.string().nullable().default(null),
})

export const AbandonedCheckoutsResponseSchema = z.object({
  items: z.array(AbandonedCheckoutSchema),
  shop: z.string(),
})

export type AbandonedLineItem = z.infer<typeof AbandonedLineItemSchema>
export type AbandonedCheckout = z.infer<typeof AbandonedCheckoutSchema>
export type AbandonedCheckoutsResponse = z.infer<typeof AbandonedCheckoutsResponseSchema>
