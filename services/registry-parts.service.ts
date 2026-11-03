// The things a product prints, as records of their own.
//
// Split from registry.service.ts because that file had reached its length
// limit, and these three belong together: they are the only calls that treat
// a PART as a thing with an identity rather than as a side effect of the
// files assigned to it.

import { type PartWriteInput, type ProductPart, ProductPartSchema } from '@/lib/validators/registry'
import { call, jsonHeaders } from '@/services/registry.service'

/**
 * Names a part on a product, before any file exists for it.
 *
 * The gesture the registry was missing. A part used to exist only because a
 * file had been assigned to it, so naming the three things a combo prints -
 * which is how the shop actually starts - had nowhere to happen.
 */
export async function createProductPart(
  token: string,
  code: string,
  body: PartWriteInput,
): Promise<ProductPart> {
  return call(
    `/registry/products/${encodeURIComponent(code)}/parts`,
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(body) },
    data => ProductPartSchema.parse(data),
  )
}

/** Renames a part, changes how it is scoped, or both. */
export async function updateProductPart(
  token: string,
  id: string,
  body: PartWriteInput,
): Promise<ProductPart> {
  return call(
    `/registry/parts/${encodeURIComponent(id)}`,
    { method: 'PATCH', headers: jsonHeaders(token), body: JSON.stringify(body) },
    data => ProductPartSchema.parse(data),
  )
}

/** Removes a part and everything configured against it. */
export async function deleteProductPart(token: string, id: string): Promise<void> {
  await call(
    `/registry/parts/${encodeURIComponent(id)}`,
    { method: 'DELETE', headers: jsonHeaders(token) },
    () => undefined,
  )
}
