'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import type { PreviewDesign, SKUReadiness } from '@/lib/validators/preview-design'
import {
  FieldMapsWriteSchema,
  ProductDesignWriteSchema,
  type FieldMap,
  type ObservedProperty,
  type ProductPart,
  type TemplateParam,
} from '@/lib/validators/registry'
import {
  clearPreviewDesign,
  listPreviewDesigns,
  listSKUReadiness,
  setPreviewDesign,
  setVariantPersonalisationLink,
} from '@/services/preview-design.service'
import {
  getProductFieldMaps,
  listObservedProperties,
  listProductParts,
  listTemplateParams,
  RegistryServiceError,
  saveProductFieldMaps,
  setProductDesign,
} from '@/services/registry.service'

import type { ActionResult } from './actions'

/**
 * The configuration half of per-SKU rendering: which .scad a product prints
 * from, and which order field feeds which of its variables.
 *
 * Separate from `registry-actions.ts` because it is read as well as written.
 * The registry page loads every product up front, but these three lists are
 * per-product and one of them - the observed properties - reads two hundred
 * recent orders to answer. Loading that for every product on every page view
 * would make a page that is usually about something else pay for a panel
 * nobody opened.
 */
export interface DesignFields {
  /** Which design file these belong to. */
  role: string
  /** The template this part's variants print from, or '' when none. */
  template_key: string
  /** The variables that template declares. Empty when there is no template. */
  params: TemplateParam[]
  /** Fields customers have actually sent for this product's SKUs. */
  properties: ObservedProperty[]
  /** The mapping as it stands. */
  maps: FieldMap[]
}

function failure(error: unknown, fallback: string): ActionResult<never> {
  return { ok: false, error: error instanceof RegistryServiceError ? error.message : fallback }
}

/**
 * Everything the Design & fields panel needs, in one round trip.
 *
 * `templateKey` comes from the product the caller already has rather than
 * being looked up again - the page fetched it, and a second lookup could
 * disagree with what is on screen.
 *
 * The params call is allowed to fail softly. A product mapped before its .scad
 * is uploaded is a normal state, and so is a template key that names a file
 * this backend cannot read; neither is a reason to refuse the mapping editor,
 * which is the part somebody came to use.
 */
export async function loadDesignFields(
  brand: string,
  code: string,
  part: { role: string; template_key: string },
): Promise<ActionResult<DesignFields>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }

  try {
    const [properties, maps] = await Promise.all([
      listObservedProperties(token, code),
      getProductFieldMaps(token, code, part.role),
    ])
    let params: TemplateParam[] = []
    if (part.template_key !== '') {
      try {
        params = await listTemplateParams(token, part.template_key)
      } catch {
        params = []
      }
    }
    return {
      ok: true,
      data: { role: part.role, template_key: part.template_key, params, properties, maps },
    }
  } catch (err) {
    return failure(err, 'Could not load the design fields.')
  }
}

/**
 * What this product prints, file by file.
 *
 * Loaded before the panel's contents, because it decides how many panels there
 * are. A product that prints one thing has one; a combo has three.
 */
export async function loadProductParts(
  brand: string,
  code: string,
): Promise<ActionResult<ProductPart[]>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }

  try {
    return { ok: true, data: await listProductParts(token, code) }
  } catch (err) {
    return failure(err, 'Could not read what this product prints.')
  }
}

/**
 * Replaces a product's whole mapping.
 *
 * Re-validated here rather than trusted from the form: a server action's
 * arguments are client-controlled, so the Zod parse is the boundary, not the
 * dropdown that produced it.
 */
export async function saveFieldMaps(
  brand: string,
  code: string,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = FieldMapsWriteSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the mapped fields.' }
  }

  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }

  try {
    await saveProductFieldMaps(token, code, parsed.data)
    revalidatePath(`/dashboard/${brand}/designs/registry`)
    return { ok: true, data: null }
  } catch (err) {
    return failure(err, 'Could not save the mapped fields.')
  }
}

/** Points every variant of a product at one template. */
export async function assignProductDesign(
  brand: string,
  code: string,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = ProductDesignWriteSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Name the template.' }
  }

  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }

  try {
    await setProductDesign(token, code, parsed.data)
    revalidatePath(`/dashboard/${brand}/designs/registry`)
    return { ok: true, data: null }
  } catch (err) {
    return failure(err, 'Could not set the design.')
  }
}

/**
 * Which assembled file each colourway's personalisation preview is drawn from.
 *
 * Read per product and on demand, like the three lists above: a product that
 * has no preview file is the ordinary case, and loading this for every
 * product on every page view would make the page pay for a panel nobody
 * opened.
 */
export async function loadPreviewDesigns(
  brand: string,
  code: string,
): Promise<ActionResult<PreviewDesign[]>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }

  try {
    return { ok: true, data: await listPreviewDesigns(token, code) }
  } catch (err) {
    return failure(err, 'Could not read the preview files for this product.')
  }
}

/**
 * Points one colourway, or all of them, at an assembled file.
 *
 * Tensor-Core refuses a file that does not declare the variables the printed
 * design is driven by, and its refusal names them - passed straight through,
 * because the person reading it is the one who can fix the .scad.
 */
export async function assignPreviewDesign(
  brand: string,
  code: string,
  input: { templateKey: string; variantSku?: string },
): Promise<ActionResult<null>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }

  try {
    await setPreviewDesign(token, code, {
      template_key: input.templateKey,
      ...(input.variantSku ? { variant_sku: input.variantSku } : {}),
    })
    revalidatePath(`/dashboard/${brand}/designs/registry`)
    return { ok: true, data: null }
  } catch (err) {
    return failure(err, 'Could not assign the preview file.')
  }
}

/** Drops the assembled file, so the picture goes back to showing what prints. */
export async function removePreviewDesign(
  brand: string,
  code: string,
  variantSku?: string,
): Promise<ActionResult<null>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }

  try {
    await clearPreviewDesign(token, code, variantSku)
    revalidatePath(`/dashboard/${brand}/designs/registry`)
    return { ok: true, data: null }
  } catch (err) {
    return failure(err, 'Could not remove the preview file.')
  }
}

/**
 * Turns one SKU's personalisation link on or off.
 *
 * Off means its customer is not asked and the job is not held for thirty
 * minutes: it renders and batches straight away.
 */
export async function toggleVariantPersonalisationLink(
  brand: string,
  variantId: string,
  enabled: boolean,
): Promise<ActionResult<null>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }

  try {
    await setVariantPersonalisationLink(token, variantId, enabled)
    revalidatePath(`/dashboard/${brand}/designs/registry`)
    return { ok: true, data: null }
  } catch (err) {
    return failure(err, 'Could not change that setting.')
  }
}

/** What each child SKU still needs before an order can be made from it. */
export async function loadSKUReadiness(
  brand: string,
  code: string,
): Promise<ActionResult<SKUReadiness[]>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }

  try {
    return { ok: true, data: await listSKUReadiness(token, code) }
  } catch (err) {
    return failure(err, 'Could not check what these SKUs still need.')
  }
}
