'use server'

import { toOrderDetailRecord } from '@/components/production/adapters'
import type { OrderLineItem } from '@/components/production/types'
import { resolveBackendToken } from '@/lib/backend-token'
import { getOrder, ProductionServiceError } from '@/services/production.service'

import type { ActionResult } from './actions'

/**
 * The line items on one order, for the hover card on the orders table.
 *
 * Fetched on demand rather than carried on the list response, which
 * deliberately omits the line_items document: shipping every attribute of every
 * line for a whole page of orders - to fill cards nobody may open - is exactly
 * the cost that decision avoids. One order's worth arrives only when somebody
 * asks for it, and the caller keeps it.
 *
 * Reuses toOrderDetailRecord so the card and the order page cannot disagree
 * about what a line says.
 *
 * Its own file rather than actions.ts, which is already at the 350-line limit.
 */
export async function orderLineItemsAction(
  orderId: string,
): Promise<ActionResult<OrderLineItem[]>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error }

  try {
    const order = await getOrder(token, orderId)
    return { ok: true, data: toOrderDetailRecord(order).lineItems }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof ProductionServiceError ? err.message : 'Could not load this order.',
    }
  }
}
