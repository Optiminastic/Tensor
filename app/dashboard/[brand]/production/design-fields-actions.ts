'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import type { PreviewDesign, SKUReadiness } from '@/lib/validators/preview-design'
import {
  FieldMapsWriteSchema,
  ProductDesignWriteSchema,
  type FieldMap,
  type FieldMapWriteInput,
  type ObservedProperty,
  type ProductPart,
  type TemplateParam,
} from '@/lib/validators/registry'
import { listTemplateParams } from '@/services/design-templates.service'
import {
  clearPreviewDesign,
  listPreviewDesigns,
  listSKUReadiness,
  PreviewDesignServiceError,
  setPreviewDesign,
} from '@/services/preview-design.service'
import {
  clearVariantFieldMaps,
  getProductFieldMaps,
  getVariantFieldMaps,
  listObservedProperties,
  listProductParts,
  RegistryServiceError,
  saveProductFieldMaps,
  saveVariantFieldMaps,
  setProductDesign,
  setProductPersonalisationLink,
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

/**
 * The refusal in the operator's words, not ours.
 *
 * EVERY SERVICE THIS FILE CALLS, which is the bug this replaces. It checked
 * RegistryServiceError alone while three services are reached from here, so
 * every refusal from the preview-design one was swallowed and shown as
 * "Could not assign the preview file." Tensor-Core had in fact named the
 * variable the chosen file does not declare and where to map it - the one
 * sentence that makes the refusal actionable - and the operator saw none of
 * it. design-templates.service throws RegistryServiceError by design, so two
 * classes cover all three.
 *
 * Still not a bare instanceof Error: a TypeError from a bug in here would
 * then reach the screen dressed as advice from Tensor-Core.
 */
function failure(error: unknown, fallback: string): ActionResult<never> {
  const known = error instanceof RegistryServiceError || error instanceof PreviewDesignServiceError
  return { ok: false, error: known ? error.message : fallback }
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

/**
 * One SKU's own mapping of one design file.
 *
 * Loaded on demand, when somebody opens that SKU's mapping - a product has a
 * handful of colourways and most of them inherit, so reading every override
 * with the page would be work for rows nobody opens.
 */
export async function loadVariantFieldMaps(
  variantId: string,
  role: string,
): Promise<ActionResult<FieldMap[]>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }
  try {
    return { ok: true, data: await getVariantFieldMaps(token, variantId, role) }
  } catch (err) {
    return failure(err, "Could not read this SKU's mapping.")
  }
}

/**
 * Saves one SKU's override, whole.
 *
 * The backend refuses an empty list rather than storing it: stored, it would
 * read back as "no override" - the same state as never having set one - so it
 * would mean the opposite of what it looks like. Removing the override is the
 * way to say that, and has its own action below.
 */
export async function saveVariantFieldMapsAction(
  brand: string,
  variantId: string,
  input: { role: string; maps: FieldMapWriteInput[] },
): Promise<ActionResult<null>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }
  try {
    await saveVariantFieldMaps(token, variantId, input)
    revalidatePath(`/dashboard/${brand}/designs/registry`)
    return { ok: true, data: null }
  } catch (err) {
    return failure(err, "Could not save this SKU's mapping.")
  }
}

/** Drops the override, so this SKU follows the product's mapping again. */
export async function removeVariantFieldMaps(
  brand: string,
  variantId: string,
  role: string,
): Promise<ActionResult<null>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }
  try {
    await clearVariantFieldMaps(token, variantId, role)
    revalidatePath(`/dashboard/${brand}/designs/registry`)
    return { ok: true, data: null }
  } catch (err) {
    return failure(err, "Could not remove this SKU's mapping.")
  }
}

/**
 * Turns a whole product's personalisation link on or off.
 *
 * Nothing is said about orders already held: a customer mid-window finishes
 * it, because the sender checks for a live link before it consults this. The
 * setting decides whether to START holding, never whether to release.
 */
export async function toggleProductPersonalisationLink(
  brand: string,
  code: string,
  enabled: boolean,
): Promise<ActionResult<null>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }
  try {
    await setProductPersonalisationLink(token, code, enabled)
    revalidatePath(`/dashboard/${brand}/designs/registry`)
    return { ok: true, data: null }
  } catch (err) {
    return failure(err, 'Could not change that setting.')
  }
}
