// Server-only by placement (called from server actions and server components).
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type SKUPipelines,
  type SKUPipelineWriteInput,
  SKUPipelinesSchema,
  type BomLine,
  BomLineSchema,
  type DesignTemplate,
  DesignTemplateSchema,
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
  type RegistryProductDetail,
  RegistryProductDetailSchema,
  RegistryProductSchema,
  type TemplateParam,
  TemplateParamSchema,
  type VariantDesignWriteInput,
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
    throw new RegistryServiceError(detail ?? 'Could not load the registry.')
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

export async function listDesignTemplates(token: string): Promise<DesignTemplate[]> {
  return call('/registry/templates', { headers: jsonHeaders(token) }, data =>
    DesignTemplateSchema.array().parse(data),
  )
}

/**
 * Replaces the .scad a template key renders from.
 *
 * Multipart, so the Content-Type header is left for fetch to set with its own
 * boundary - jsonHeaders here would produce a body the backend cannot parse.
 */
export async function uploadDesignTemplate(
  token: string,
  key: string,
  form: FormData,
): Promise<DesignTemplate> {
  return call(
    `/registry/templates/${encodeURIComponent(key)}`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form },
    data => DesignTemplateSchema.parse(data),
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

/**
 * The variables a template declares, read from the file a render would use.
 *
 * The right-hand side of the mapping editor. Resolved through the renderer
 * rather than the upload table, so what the dropdown offers is what actually
 * prints - the uploaded override where one exists, the embedded copy where
 * none does.
 */
export async function listTemplateParams(token: string, key: string): Promise<TemplateParam[]> {
  return call(
    `/registry/templates/${encodeURIComponent(key)}/params`,
    { headers: jsonHeaders(token) },
    data => TemplateParamSchema.array().parse(data),
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
