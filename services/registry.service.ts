// Server-only by placement (called from server actions and server components).
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type SKUPipelines,
  type SKUPipelineWriteInput,
  SKUPipelinesSchema,
  type BomLine,
  BomLineSchema,
  type FieldMap,
  FieldMapSchema,
  type FieldMapWriteInput,
  type ImportProductInput,
  type ImportProductResult,
  ImportProductResultSchema,
  type ObservedProperty,
  ObservedPropertySchema,
  type ProductPart,
  ProductPartSchema,
  type ProductDesignWriteInput,
  type ProductWriteInput,
  type RegistryProduct,
  type PipelineTargets,
  PipelineTargetsSchema,
  type RegistryProductDetail,
  RegistryProductDetailSchema,
  RegistryProductSchema,
  type VariantDesignWriteInput,
  type ColourPart,
  ColourPartSchema,
  ColourPartsResponseSchema,
  type ColourSchemeWriteInput,
} from '@/lib/validators/registry'

const log = createLogger('RegistryService')
const TIMEOUT_MS = 15_000

/**
 * Typed client for the product registry: products, their option axes, the
 * variants those make, and each variant's bill of materials.
 *
 * Guarded by registry:read / config:manage on the backend - reading the
 * catalogue was split away from reading cost configuration so an Operator can
 * have the page without the costs. Prices in these responses are withheld by
 * the backend from a caller without config:read.
 */
export class RegistryServiceError extends Error {}

/**
 * What a refusal says when Tensor-Core gives no detail of its own.
 *
 * Most calls through here read something, so it reads that way - but a 404
 * from a route this build does not have reaches a WRITE with the same words,
 * and "could not load" is then simply untrue. Exported so a write can
 * recognise it and say what actually failed.
 */
export const REGISTRY_READ_FAILED = 'Could not load the registry.'

async function call<T>(path: string, init: RequestInit, parse: (data: unknown) => T): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    log.warn({ path, error }, 'Tensor-Core is unreachable')
    throw new RegistryServiceError('Could not reach Tensor-Core.')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ path, status: response.status, detail }, 'Tensor-Core rejected the request')
    throw new RegistryServiceError(detail ?? REGISTRY_READ_FAILED)
  }

  const body = response.status === 204 ? undefined : await response.json()
  try {
    return parse(body)
  } catch (error) {
    // A schema mismatch is otherwise invisible: the page catches it, sees
    // something that is not a RegistryServiceError and shows the generic
    // "Could not load the product registry", which names neither the field nor
    // the product. Log the issues so the next one takes seconds, not an hour.
    log.warn({ path, error }, 'Tensor-Core sent a shape the registry does not expect')
    throw new RegistryServiceError('Could not read the registry response.')
  }
}

function jsonHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export async function listRegistryProducts(token: string): Promise<RegistryProduct[]> {
  return call('/registry/products', { headers: jsonHeaders(token) }, data =>
    RegistryProductSchema.array().parse(data),
  )
}

/**
 * One product's whole definition: its axes, their values, and every variant.
 *
 * Addressed by CODE rather than id - the code is what an order's SKU carries and
 * what a person says out loud ("the DNP"), so it is what the URL carries too.
 */
export async function getRegistryProduct(
  token: string,
  code: string,
): Promise<RegistryProductDetail> {
  return call(
    `/registry/products/${encodeURIComponent(code)}`,
    { headers: jsonHeaders(token) },
    data => RegistryProductDetailSchema.parse(data),
  )
}

export async function getVariantBom(token: string, variantId: string): Promise<BomLine[]> {
  return call(
    `/registry/variants/${encodeURIComponent(variantId)}/bom`,
    { headers: jsonHeaders(token) },
    data => BomLineSchema.array().parse(data),
  )
}

/** The bill of materials every variant of a product inherits. */
export async function getProductBom(token: string, code: string): Promise<BomLine[]> {
  return call(
    `/registry/products/${encodeURIComponent(code)}/bom`,
    { headers: { Authorization: `Bearer ${token}` } },
    data => BomLineSchema.array().parse(data),
  )
}

/**
 * Replaces a product's bill of materials, whole.
 *
 * The list every SKU inherits. A SKU that declares one of its own replaces it
 * entirely rather than adding to it - so an upgraded box does not arrive
 * alongside the standard one.
 */
export async function saveProductBom(
  token: string,
  code: string,
  lines: { item_id: string; quantity: number }[],
): Promise<BomLine[]> {
  return call(
    `/registry/products/${encodeURIComponent(code)}/bom`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines }),
    },
    data => BomLineSchema.array().parse(data),
  )
}

/**
 * Replaces a variant's bill of materials, whole.
 *
 * The entire list in one request rather than per-line add and remove: a BOM is
 * edited as a list and saved once, so a half-applied edit cannot leave a variant
 * carrying a battery and no switch. A variant with the wrong parts is worse than
 * one with none, because it looks finished.
 */
export async function saveVariantBom(
  token: string,
  variantId: string,
  lines: { item_id: string; quantity: number }[],
): Promise<BomLine[]> {
  return call(
    `/registry/variants/${encodeURIComponent(variantId)}/bom`,
    { method: 'PUT', headers: jsonHeaders(token), body: JSON.stringify({ lines }) },
    data => BomLineSchema.array().parse(data),
  )
}

/**
 * Corrects a product already registered.
 *
 * Addressed by CODE rather than id, matching the read path: the code
 * is what an order's SKU carries and what a person says out loud, so it is what
 * the URL carries. A code change is therefore a rename of the address itself,
 * which is why the caller gets the new product back rather than assuming.
 */
export async function updateProduct(
  token: string,
  code: string,
  input: ProductWriteInput,
): Promise<RegistryProduct> {
  return call(
    `/registry/products/${encodeURIComponent(code)}`,
    { method: 'PATCH', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => RegistryProductSchema.partial({ option_count: true, variant_count: true }).parse(data),
  ) as Promise<RegistryProduct>
}

/**
 * Deletes a product and everything defined under it.
 *
 * The code is sent again as `confirm` because the backend demands it: the
 * cascade reaches the product's options, variants, designs and bills of
 * materials, and this is the only irreversible action in the registry.
 */
export async function deleteProduct(token: string, code: string): Promise<void> {
  await call(
    `/registry/products/${encodeURIComponent(code)}?confirm=${encodeURIComponent(code)}`,
    { method: 'DELETE', headers: jsonHeaders(token) },
    () => undefined,
  )
}

/**
 * The registry's authoring endpoints for options and hand-built variants still
 * exist in Tensor-Core, and are deliberately not wrapped here.
 *
 * A variant is a SKU, and Shopify is where SKUs are decided. Typing one into
 * Tensor produces a second answer to a question that already had one - which
 * is how DNP came to carry six variants named "2 hearts, With light" with no
 * SKUs at all, matching no order that has ever arrived.
 */

/** Names the file that prints one role of a variant. */
export async function setVariantDesign(
  token: string,
  id: string,
  input: VariantDesignWriteInput,
): Promise<void> {
  await call(
    `/registry/variants/${encodeURIComponent(id)}/design`,
    { method: 'PUT', headers: jsonHeaders(token), body: JSON.stringify(input) },
    () => undefined,
  )
}

/** The personalisation fields customers have actually sent for this product. */
export async function listObservedProperties(
  token: string,
  code: string,
): Promise<ObservedProperty[]> {
  return call(
    `/registry/products/${encodeURIComponent(code)}/observed-properties`,
    { headers: jsonHeaders(token) },
    data => ObservedPropertySchema.array().parse(data),
  )
}

/**
 * What this product prints, file by file.
 *
 * One entry for a product that prints one thing, three for a combo - a plank,
 * a rose and a keychain, each with its own template and its own mapping.
 */
export async function listProductParts(token: string, code: string): Promise<ProductPart[]> {
  return call(
    `/registry/products/${encodeURIComponent(code)}/parts`,
    { headers: jsonHeaders(token) },
    data => ProductPartSchema.array().parse(data),
  )
}

export async function getProductFieldMaps(
  token: string,
  code: string,
  role: string,
): Promise<FieldMap[]> {
  return call(
    `/registry/products/${encodeURIComponent(code)}/field-maps?role=${encodeURIComponent(role)}`,
    { headers: jsonHeaders(token) },
    data => FieldMapSchema.array().parse(data),
  )
}

/**
 * Replaces a product's whole field mapping.
 *
 * The entire list in one request, the way a bill of materials is saved: a
 * half-applied edit that left a product mapping a first name and not a second
 * would hold every order it touched, and the failure would surface hours later
 * on the issues board rather than in front of the person who caused it.
 */
export async function saveProductFieldMaps(
  token: string,
  code: string,
  input: { role: string; maps: FieldMapWriteInput[] },
): Promise<void> {
  await call(
    `/registry/products/${encodeURIComponent(code)}/field-maps` +
      `?role=${encodeURIComponent(input.role)}`,
    { method: 'PUT', headers: jsonHeaders(token), body: JSON.stringify({ maps: input.maps }) },
    () => undefined,
  )
}

/** Points every variant of a product at one template, for one design file. */
export async function setProductDesign(
  token: string,
  code: string,
  input: ProductDesignWriteInput,
): Promise<void> {
  await call(
    `/registry/products/${encodeURIComponent(code)}/design`,
    { method: 'PUT', headers: jsonHeaders(token), body: JSON.stringify(input) },
    () => undefined,
  )
}

/**
 * Creates or refreshes a registry product from the brand's Shopify catalogue.
 *
 * Under /brands rather than /registry because it needs the brand's Shopify
 * connection, which is addressed by slug - and because the picker and the
 * import must read the same list or they can disagree about what exists.
 *
 * Idempotent, and meant to be re-run: a product that gained a colour gets its
 * new SKU by importing it again.
 */
export async function importShopifyProduct(
  token: string,
  brandSlug: string,
  input: ImportProductInput,
): Promise<ImportProductResult> {
  return call(
    `/brands/${encodeURIComponent(brandSlug)}/shopify-products/import`,
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => ImportProductResultSchema.parse(data),
  )
}

/**
 * Every SKU with the slicer pipeline it prints with, plus the pipelines on
 * offer.
 *
 * One read for the whole table: sixty-odd SKUs, and the page shows all of them.
 */
export async function listSKUPipelines(token: string): Promise<SKUPipelines> {
  return call('/registry/sku-pipelines', { headers: jsonHeaders(token) }, data =>
    SKUPipelinesSchema.parse(data),
  )
}

/**
 * Saves a SET of mappings at once.
 *
 * A set rather than a row, because mapping twenty SKUs to one pipeline is the
 * job this page exists for and twenty requests could each fail on their own.
 * Returns the whole table back, so the page renders what was actually stored
 * rather than what it hoped it stored.
 */
/** The products slicer settings are assigned to, and the SKUs with no parent. */
export async function listPipelineTargets(token: string): Promise<PipelineTargets> {
  return call(
    '/registry/pipeline-targets',
    { headers: { Authorization: `Bearer ${token}` } },
    data => PipelineTargetsSchema.parse(data),
  )
}

export async function saveSKUPipelines(
  token: string,
  input: SKUPipelineWriteInput,
): Promise<SKUPipelines> {
  return call(
    '/registry/sku-pipelines',
    { method: 'PUT', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => SKUPipelinesSchema.parse(data),
  )
}

/** Every configured coloured piece of a product, across its design files. */
export async function listColourParts(token: string, code: string): Promise<ColourPart[]> {
  return call(
    `/registry/products/${encodeURIComponent(code)}/colour-parts`,
    { headers: { Authorization: `Bearer ${token}` } },
    data => ColourPartsResponseSchema.parse(data).items,
  )
}

/**
 * Reads a reference 3MF and replaces one design file's pieces with what it
 * contains.
 *
 * Replaces rather than merges: a piece that has gone from the file has gone
 * from the product, and asking the template for one it no longer has renders
 * nothing and holds the job.
 */
export async function uploadColourReference(
  token: string,
  target: { code: string; role: string },
  form: FormData,
): Promise<ColourPart[]> {
  const { code, role } = target
  return call(
    `/registry/products/${encodeURIComponent(code)}/colour-parts/${encodeURIComponent(role)}`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form },
    data => ColourPartsResponseSchema.parse(data).items,
  )
}

/** Moves one piece between a fixed colour and the customer's choice. */
export async function setColourPartColour(
  token: string,
  id: string,
  colourHex: string,
): Promise<ColourPart> {
  return call(
    `/registry/colour-parts/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ colour_hex: colourHex }),
    },
    data => ColourPartSchema.parse(data),
  )
}

/**
 * Replaces one design file's pieces for one colourway, typed out rather than
 * read from a 3MF.
 *
 * The 3MF route above is still the better one where a reference file exists.
 * This is for the product that has none, and for the product whose palette is
 * designed per variant - a pink outline on the purple one, gold on the red -
 * which a single file cannot state.
 */
export async function putColourScheme(
  token: string,
  target: { code: string; role: string },
  input: ColourSchemeWriteInput,
): Promise<ColourPart[]> {
  return call(
    `/registry/products/${encodeURIComponent(target.code)}/colour-parts/${encodeURIComponent(target.role)}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    data => ColourPartsResponseSchema.parse(data).items,
  )
}

/**
 * Returns one design file to the default white-base, coloured-lettering pair.
 *
 * With a SKU, drops only that colourway's override, leaving the product's own
 * scheme - which that variant then falls back to - in place.
 */
export async function clearColourParts(
  token: string,
  target: { code: string; role: string; variantSKU?: string },
): Promise<void> {
  const { code, role, variantSKU } = target
  const scope = variantSKU ? `?variant_sku=${encodeURIComponent(variantSKU)}` : ''
  await call(
    `/registry/products/${encodeURIComponent(code)}/colour-parts/${encodeURIComponent(role)}${scope}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
    () => null,
  )
}

// Shared with design-templates.service.ts, which speaks to the same service
// with the same error type - one client, so a refusal reads the same wherever
// it came from.
export { call as coreCall, jsonHeaders as coreHeaders }

/**
 * One SKU's own mapping of one design file.
 *
 * Read whole and saved whole, like the product's: fieldMapsFor returns a SKU's
 * override entire or not at all, never merged with the product's - a
 * half-override is a mapping that exists in neither place.
 */
export async function getVariantFieldMaps(
  token: string,
  variantId: string,
  role: string,
): Promise<FieldMap[]> {
  return call(
    `/registry/variants/${encodeURIComponent(variantId)}/field-maps?role=${encodeURIComponent(role)}`,
    { headers: jsonHeaders(token) },
    data => FieldMapSchema.array().parse(data),
  )
}

export async function saveVariantFieldMaps(
  token: string,
  variantId: string,
  input: { role: string; maps: FieldMapWriteInput[] },
): Promise<void> {
  await call(
    `/registry/variants/${encodeURIComponent(variantId)}/field-maps` +
      `?role=${encodeURIComponent(input.role)}`,
    { method: 'PUT', headers: jsonHeaders(token), body: JSON.stringify({ maps: input.maps }) },
    () => undefined,
  )
}

/** Drops the override, so this SKU follows the product's mapping again. */
export async function clearVariantFieldMaps(
  token: string,
  variantId: string,
  role: string,
): Promise<void> {
  await call(
    `/registry/variants/${encodeURIComponent(variantId)}/field-maps?role=${encodeURIComponent(role)}`,
    { method: 'DELETE', headers: jsonHeaders(token) },
    () => undefined,
  )
}

/**
 * Turns a whole product's personalisation link on or off.
 *
 * One call rather than one per SKU: the column is per variant because a
 * variant is what an order resolves to, but the decision is about the product.
 *
 * Off does NOT release an order whose customer already has the page open.
 * Tensor-Core checks for a live link first and lets that window finish, so the
 * switch decides whether to start holding, never whether to release.
 */
export async function setProductPersonalisationLink(
  token: string,
  code: string,
  enabled: boolean,
): Promise<void> {
  await call(
    `/registry/products/${encodeURIComponent(code)}/personalisation-link`,
    { method: 'PATCH', headers: jsonHeaders(token), body: JSON.stringify({ enabled }) },
    () => undefined,
  )
}
