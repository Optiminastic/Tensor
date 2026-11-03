// A mapping proposed from the design file and the product's own orders.
//
// Its own module rather than another call in registry.service.ts, which is at
// its length limit - and this one is a different kind of call anyway: every
// other registry read returns what is configured, and this returns what could
// be.

import {
  type FieldSuggestions,
  FieldSuggestionsResponseSchema,
} from '@/lib/validators/registry-suggest'
import { call, jsonHeaders } from '@/services/registry.service'

/**
 * What Tensor would map, for this product's design file, if asked.
 *
 * READ-ONLY, and the whole feature rests on that. The person still presses
 * Save mapping. A proposal that applied itself would mean re-uploading a
 * corrected drawing silently re-pointed a live product's fields, and the
 * first sign of it would be a batch of planks with the names swapped.
 *
 * `sku` asks for one colourway's own file. A product whose child SKUs carry
 * separate .scad files declares a different set of variables per SKU, which
 * is the case this exists for; omitting it reads the product-wide file.
 */
export async function fetchFieldSuggestions(
  token: string,
  code: string,
  where: { role: string; sku?: string },
): Promise<FieldSuggestions> {
  const params = new URLSearchParams({ role: where.role })
  if (where.sku !== undefined && where.sku !== '') params.set('sku', where.sku)

  return call(
    `/registry/products/${encodeURIComponent(code)}/field-suggestions?${params.toString()}`,
    { headers: jsonHeaders(token) },
    data => FieldSuggestionsResponseSchema.parse(data),
  )
}
