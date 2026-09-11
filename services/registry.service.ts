// Server-only by placement (called from server actions and server components).
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type BomLine,
  BomLineSchema,
  type DesignTemplate,
  DesignTemplateSchema,
  type OptionValueWriteInput,
  type OptionWriteInput,
  type ProductWriteInput,
  type RegistryProduct,
  type RegistryProductDetail,
  RegistryProductDetailSchema,
  RegistryProductSchema,
  type VariantDesignWriteInput,
  type VariantWriteInput,
} from '@/lib/validators/registry'

const log = createLogger('RegistryService')
const TIMEOUT_MS = 15_000

/**
 * Typed client for the product registry: products, their option axes, the
 * variants those make, and each variant's bill of materials.
 *
 * Guarded by config:read / config:manage on the backend - a registry is
 * configuration in the sense that permission already names, "cost assumptions,
 * materials and machines".
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
 * Registers a product, or corrects one already registered.
 *
 * Addressed by CODE on update rather than id, matching the read path: the code
 * is what an order's SKU carries and what a person says out loud, so it is what
 * the URL carries. A code change is therefore a rename of the address itself,
 * which is why the caller gets the new product back rather than assuming.
 */
export async function createProduct(
  token: string,
  input: ProductWriteInput,
): Promise<RegistryProduct> {
  return call(
    '/registry/products',
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(input) },
    data => RegistryProductSchema.partial({ option_count: true, variant_count: true }).parse(data),
  ) as Promise<RegistryProduct>
}

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
 * Authoring the registry: axes, their values, and the variants those make.
 *
 * These are what stop a product change being a code change. Adding a colour
 * used to mean editing `generatedSKUSegments`, recompiling and deploying.
 */
export async function createOption(
  token: string,
  code: string,
  input: OptionWriteInput,
): Promise<void> {
  await call(
    `/registry/products/${encodeURIComponent(code)}/options`,
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(input) },
    () => undefined,
  )
}

export async function updateOption(
  token: string,
  id: string,
  input: OptionWriteInput,
): Promise<void> {
  await call(
    `/registry/options/${encodeURIComponent(id)}`,
    { method: 'PATCH', headers: jsonHeaders(token), body: JSON.stringify(input) },
    () => undefined,
  )
}

export async function deleteOption(token: string, id: string): Promise<void> {
  await call(
    `/registry/options/${encodeURIComponent(id)}`,
    { method: 'DELETE', headers: jsonHeaders(token) },
    () => undefined,
  )
}

export async function createOptionValue(
  token: string,
  optionId: string,
  input: OptionValueWriteInput,
): Promise<void> {
  await call(
    `/registry/options/${encodeURIComponent(optionId)}/values`,
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(input) },
    () => undefined,
  )
}

export async function deleteOptionValue(token: string, id: string): Promise<void> {
  await call(
    `/registry/option-values/${encodeURIComponent(id)}`,
    { method: 'DELETE', headers: jsonHeaders(token) },
    () => undefined,
  )
}

export async function createVariant(
  token: string,
  code: string,
  input: VariantWriteInput,
): Promise<void> {
  await call(
    `/registry/products/${encodeURIComponent(code)}/variants`,
    { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify(input) },
    () => undefined,
  )
}

export async function updateVariant(
  token: string,
  id: string,
  input: VariantWriteInput,
): Promise<void> {
  await call(
    `/registry/variants/${encodeURIComponent(id)}`,
    { method: 'PATCH', headers: jsonHeaders(token), body: JSON.stringify(input) },
    () => undefined,
  )
}

export async function deleteVariant(token: string, id: string): Promise<void> {
  await call(
    `/registry/variants/${encodeURIComponent(id)}`,
    { method: 'DELETE', headers: jsonHeaders(token) },
    () => undefined,
  )
}

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
