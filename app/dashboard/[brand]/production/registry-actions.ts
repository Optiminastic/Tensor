'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import {
  OptionValueWriteSchema,
  OptionWriteSchema,
  ProductWriteSchema,
  VariantDesignWriteSchema,
  VariantWriteSchema,
  type RegistryProduct,
} from '@/lib/validators/registry'
import {
  createOption,
  createOptionValue,
  createProduct,
  createVariant,
  deleteOption,
  deleteOptionValue,
  deleteProduct,
  deleteVariant,
  RegistryServiceError,
  setVariantDesign,
  updateOption,
  updateProduct,
  updateVariant,
} from '@/services/registry.service'

import type { ActionResult } from './actions'

/**
 * Writes to the product registry: add a product, correct one, remove one.
 *
 * These are the actions that stop a product change being a code change. Adding
 * a colour or a heart count used to mean editing Go constants, recompiling and
 * deploying; the point of the registry is that the people who know the answers
 * can enter them.
 *
 * Every argument is re-validated here rather than trusted from the form. A
 * server action's arguments are client-controlled - the POST behind the form
 * can be replayed with any payload - so the Zod parse is the boundary, not the
 * disabled select that produced it.
 */
function revalidateRegistry(brand: string): void {
  revalidatePath(`/dashboard/${brand}/production/registry`)
}

function failure(error: unknown, fallback: string): ActionResult<never> {
  return { ok: false, error: error instanceof RegistryServiceError ? error.message : fallback }
}

export async function addProduct(
  brand: string,
  input: unknown,
): Promise<ActionResult<RegistryProduct>> {
  const parsed = ProductWriteSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the product details.' }
  }

  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }

  try {
    const product = await createProduct(token, parsed.data)
    revalidateRegistry(brand)
    return { ok: true, data: product }
  } catch (err) {
    return failure(err, 'Could not create the product.')
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
 * Removes a product, its options, its variants, their designs and their bills
 * of materials. Nothing else in the registry is destructive.
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
 * Every authoring action below follows the same three steps: re-validate the
 * payload here (a server action's arguments are client-controlled, so the Zod
 * parse is the boundary, not the form that produced it), resolve a token, then
 * revalidate the registry page so the change is visible without a reload.
 */
async function run(
  brand: string,
  work: (token: string) => Promise<void>,
  fallback: string,
): Promise<ActionResult<null>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }
  try {
    await work(token)
    revalidateRegistry(brand)
    return { ok: true, data: null }
  } catch (err) {
    return failure(err, fallback)
  }
}

export async function addOption(
  brand: string,
  code: string,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = OptionWriteSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the option.' }
  }
  return run(brand, token => createOption(token, code, parsed.data), 'Could not add the option.')
}

export async function editOption(
  brand: string,
  id: string,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = OptionWriteSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the option.' }
  }
  return run(brand, token => updateOption(token, id, parsed.data), 'Could not update the option.')
}

export async function removeOption(brand: string, id: string): Promise<ActionResult<null>> {
  return run(brand, token => deleteOption(token, id), 'Could not delete the option.')
}

export async function addOptionValue(
  brand: string,
  optionId: string,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = OptionValueWriteSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the value.' }
  }
  return run(
    brand,
    token => createOptionValue(token, optionId, parsed.data),
    'Could not add the value.',
  )
}

export async function removeOptionValue(brand: string, id: string): Promise<ActionResult<null>> {
  return run(brand, token => deleteOptionValue(token, id), 'Could not delete the value.')
}

export async function addVariant(
  brand: string,
  code: string,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = VariantWriteSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the variant.' }
  }
  return run(brand, token => createVariant(token, code, parsed.data), 'Could not add the variant.')
}

export async function editVariant(
  brand: string,
  id: string,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = VariantWriteSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the variant.' }
  }
  return run(brand, token => updateVariant(token, id, parsed.data), 'Could not update the variant.')
}

export async function removeVariant(brand: string, id: string): Promise<ActionResult<null>> {
  return run(brand, token => deleteVariant(token, id), 'Could not delete the variant.')
}

/** Names the file that prints one role of a variant. */
export async function assignVariantDesign(
  brand: string,
  id: string,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = VariantDesignWriteSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the design.' }
  }
  return run(brand, token => setVariantDesign(token, id, parsed.data), 'Could not set the design.')
}
