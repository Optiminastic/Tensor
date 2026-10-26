'use server'

import { revalidatePath } from 'next/cache'

import { resolveBackendToken } from '@/lib/backend-token'
import {
  type PipelineTargets,
  type SKUPipelines,
  SKUPipelineWriteInputSchema,
} from '@/lib/validators/registry'
import {
  listPipelineTargets,
  listSKUPipelines,
  RegistryServiceError,
  saveSKUPipelines,
} from '@/services/registry.service'

import type { ActionResult } from './actions'

function failure(error: unknown, fallback: string): ActionResult<never> {
  return { ok: false, error: error instanceof RegistryServiceError ? error.message : fallback }
}

/**
 * Every SKU and the slicer pipeline it prints with, plus what is on offer.
 *
 * Read on demand rather than with the page: the pipeline list lives in
 * BambuBuddy and changes there, so a copy fetched when the registry loaded
 * would offer pipelines that have since been renamed or removed.
 */
export async function loadSKUPipelines(): Promise<ActionResult<SKUPipelines>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }

  try {
    return { ok: true, data: await listSKUPipelines(token) }
  } catch (err) {
    return failure(err, 'Could not read the SKU list.')
  }
}

/**
 * The products slicer settings are assigned to, and the SKUs with no parent.
 *
 * Read on demand for the same reason as the SKU list: the pipelines live in
 * BambuBuddy and change there.
 */
export async function loadPipelineTargets(): Promise<ActionResult<PipelineTargets>> {
  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }

  try {
    return { ok: true, data: await listPipelineTargets(token) }
  } catch (err) {
    return failure(err, 'Could not read the products.')
  }
}

/**
 * Saves a set of SKU-to-pipeline mappings.
 *
 * Re-validated here because a server action's arguments are client-controlled:
 * the dropdowns only ever offer a pipeline of the right class, but the POST
 * behind them can be replayed with any payload, and the backend checks the
 * class again for the same reason.
 */
export async function saveSKUPipelinesAction(
  brand: string,
  input: unknown,
): Promise<ActionResult<SKUPipelines>> {
  const parsed = SKUPipelineWriteInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Could not read the mappings to save.',
    }
  }

  const { token, error } = await resolveBackendToken()
  if (!token) return { ok: false, error: error ?? 'Your session has expired. Sign in again.' }

  try {
    const saved = await saveSKUPipelines(token, parsed.data)
    // Both, because the Slicing tab is on each: the full registry under
    // Designs, and the narrower page the floor reads.
    revalidatePath(`/dashboard/${brand}/designs/registry`)
    revalidatePath(`/dashboard/${brand}/production/slicing-settings`)
    return { ok: true, data: saved }
  } catch (err) {
    return failure(err, 'Could not save the slicing settings.')
  }
}
