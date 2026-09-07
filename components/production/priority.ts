/**
 * Whether an order paid for priority dispatch.
 *
 * Mirrors OrderIsPriority in the backend (internal/httpapi/order_priority.go),
 * which is what actually decides batching order. This copy exists because the
 * order DTO already carries the shipping option verbatim, so the badge needs no
 * extra field on the wire - but it means the two must agree, and the substring
 * is the contract between them.
 *
 * A substring rather than an equality check against "PRIORITY DISPATCH ⚡️":
 * the store has reworded this option once already, and an emoji is a poor thing
 * to hinge a customer's promise on. The word is specific enough - the standard
 * option reads "FREE DISPATCH - BEST DEAL 🎉".
 */
const PRIORITY_SHIPPING_MARKER = 'priority'

export function isPriorityShipping(shippingTitle: string | null | undefined): boolean {
  if (!shippingTitle) return false
  return shippingTitle.toLowerCase().includes(PRIORITY_SHIPPING_MARKER)
}
