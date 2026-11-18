'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import type { PreviewDesign } from '@/lib/validators/preview-design'
import {
  ImportProductSchema,
  ProductWriteSchema,
  VariantDesignWriteSchema,
  type ImportProductResult,
  type ProductPart,
  type RegistryProduct,
  type RegistryProductDetail,
} from '@/lib/validators/registry'
import type { ShopifyProduct } from '@/lib/validators/shopify-products'
import { listPreviewDesigns } from '@/services/preview-design.service'
import {
  deleteProduct,
  getRegistryProduct,
  importShopifyProduct,
  listProductParts,
  RegistryServiceError,
  setVariantDesign,
  updateProduct,
} from '@/services/registry.service'
import {
  listShopifyProducts,
  ShopifyProductsServiceError,
} from '@/services/shopify-products.service'

import type { ActionResult } from './actions'

/**
 * Writes to the product registry: import a product, correct one, remove one.
 *
 * These are the actions that stop a product change being a code change. Adding
 * a colour used to mean editing Go constants, recompiling and deploying; the
 * point of the registry is that the people who know the answers can enter them
 * - and for a product's SKUs, the thing that knows the answers is Shopify.
 *
 * Every argument is re-validated here rather than trusted from the form. A
 * server action's arguments are client-controlled - the POST behind the form
 * can be replayed with any payload - so the Zod parse is the boundary, not the
 * disabled select that produced it.
 */
function revalidateRegistry(brand: string): void {
  revalidatePath(`/dashboard/${brand}/designs/registry`)
}

/**
 * The refusal in the operator's words, not ours.
 *
 * Both services this file calls. importShopifyProduct goes through here and
 * throws the Shopify one, so a refusal naming the variant that has no SKU
 * was being replaced with "Could not import that product." - true, and no
 * help to the person who can go and fix it.
 */
function failure(error: unknown, fallback: string): ActionResult<never> {
  const known =
    error instanceof RegistryServiceError || error instanceof ShopifyProductsServiceError
  return { ok: false, error: known ? error.message : fallback }
}

/** What the registry needs to show one product: its definition and its design. */
export interface ProductWorkspace {
  product: RegistryProductDetail
  /** null when it could not be read here; the panel then reads it itself. */
  parts: ProductPart[] | null
  previews: PreviewDesign[] | null
}

/**
 * Everything the open product's card loads on opening, in ONE call.
 *
 * Opening a product used to be one action for its definition, then one for its
 * parts, then one for its preview files - and Next runs a page's server actions
 * one at a time, so they queued behind each other. Here the three are read in
 * parallel on the server. A failure of the parts or previews does not fail the
 * product: those come back null and the Design & fields panel reads them
 * itself, as it did before.
 */
export async function loadProductWorkspace(
  _brand: string,
  code: string,
): Promise<ActionResult<ProductWorkspace>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }

  const [product, parts, previews] = await Promise.allSettled([
    getRegistryProduct(token, code),
    listProductParts(token, code),
    listPreviewDesigns(token, code),
  ])
  if (product.status === 'rejected') return failure(product.reason, 'Could not load that product.')
  return {
    ok: true,
    data: {
      product: product.value,
      parts: parts.status === 'fulfilled' ? parts.value : null,
      previews: previews.status === 'fulfilled' ? previews.value : null,
    },
  }
}

/**
 * The brand's live Shopify catalogue, for the import picker.
 *
 * An action rather than a page fetch, so opening the registry does not call
 * Shopify. Most visits are to read what is already configured; the catalogue
 * is only needed by somebody about to add something.
 */
export async function loadShopifyCatalogue(brand: string): Promise<ActionResult<ShopifyProduct[]>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }

  try {
    return { ok: true, data: await listShopifyProducts(token, brand) }
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof ShopifyProductsServiceError
          ? err.message
          : 'Could not read the products from Shopify.',
    }
  }
}

/**
 * Registers a product from Shopify, with its real SKUs.
 *
 * Re-running it is how a product that gained a colour gets its new SKU. The
 * result says how many variants were imported, how many Shopify carries with
 * no SKU, and how many this import stopped matching - all three matter, and
 * the middle one is a thing to go and fix in the shop.
 */
export async function importProduct(
  brand: string,
  input: unknown,
): Promise<ActionResult<ImportProductResult>> {
  const parsed = ImportProductSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Choose a product to import.' }
  }

  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }

  try {
    const result = await importShopifyProduct(token, brand, parsed.data)
    revalidateRegistry(brand)
    return { ok: true, data: result }
  } catch (err) {
    return failure(err, 'Could not import that product.')
  }
}

/**
 * `code` is the product being edited; `input.code` may differ, which renames it.
 * They are separate arguments for that reason - collapsing them would make a
 * rename indistinguishable from editing the wrong product.
 */
export async function editProduct(
  brand: string,
  code: string,
  input: unknown,
): Promise<ActionResult<RegistryProduct>> {
  const parsed = ProductWriteSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the product details.' }
  }

  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }

  try {
    const product = await updateProduct(token, code, parsed.data)
    revalidateRegistry(brand)
    return { ok: true, data: product }
  } catch (err) {
    return failure(err, 'Could not update the product.')
  }
}

/**
 * Removes a product, its variants, their designs and their bills of materials.
 * Nothing else in the registry is destructive.
 */
export async function removeProduct(brand: string, code: string): Promise<ActionResult<null>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }

  try {
    await deleteProduct(token, code)
    revalidateRegistry(brand)
    return { ok: true, data: null }
  } catch (err) {
    return failure(err, 'Could not delete the product.')
  }
}

/**
 * Names the file that prints one role of ONE variant.
 *
 * The product-level `assignProductDesign` is what somebody normally uses: a
 * template prints every colour. This stays for the case that one cannot serve
 * - an uploaded 3MF, which is a single specific model and belongs to a single
 * variant.
 */
export async function assignVariantDesign(
  brand: string,
  id: string,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = VariantDesignWriteSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the design.' }
  }

  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }

  try {
    await setVariantDesign(token, id, parsed.data)
    revalidateRegistry(brand)
    return { ok: true, data: null }
  } catch (err) {
    return failure(err, 'Could not set the design.')
  }
}
