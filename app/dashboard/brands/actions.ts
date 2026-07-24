'use server'

import { headers } from 'next/headers'

import { auth } from '@/lib/auth'
import { createLogger } from '@/lib/logger'
import { clearPendingCookie, readPendingCookie } from '@/lib/shopify/pending'
import { type BrandProfile, BrandCreateSchema, BrandUpdateSchema } from '@/lib/validators/brands'
import {
  type Connection,
  ConnectionProviderSchema,
  ConnectionUpsertSchema,
} from '@/lib/validators/connections'
import {
  BrandServiceError,
  createBrand as createBrandRequest,
  deleteBrand as deleteBrandRequest,
  updateBrand as updateBrandRequest,
} from '@/services/brands.service'
import {
  ConnectionServiceError,
  deleteConnection as deleteConnectionRequest,
  upsertConnection as upsertConnectionRequest,
} from '@/services/connections.service'

const log = createLogger('BrandActions')

export interface ActionResult<T = undefined> {
  ok: boolean
  error?: string
  data?: T
}

function describe(error: unknown): string {
  if (error instanceof BrandServiceError || error instanceof ConnectionServiceError) {
    return error.message
  }
  log.error({ err: error }, 'Unexpected error in a brand action')
  return 'Something went wrong. Please try again.'
}

// Re-resolves identity server-side. A server action's arguments are
// client-controlled, so the token never comes from them.
async function resolveToken(): Promise<{ token?: string; error?: string }> {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session) return { error: 'Your session has expired. Sign in again.' }

  const token = await auth.api.getToken({ headers: requestHeaders })
  if (!token?.token) return { error: 'Could not mint an access token. Sign in again.' }
  return { token: token.token }
}

// Persists the Shopify connection captured during OAuth. The token was stashed
// server-side (encrypted cookie) by the callback because the brand did not exist
// yet; now that it does, move it into the brand's connections. A missing cookie
// (skipped or expired) is a no-op success.
export async function finalizeShopifyConnection(slug: string): Promise<ActionResult> {
  const pending = await readPendingCookie()
  if (!pending) return { ok: true }

  const { token, error } = await resolveToken()
  if (!token) return { ok: false, error }

  try {
    await upsertConnectionRequest(token, {
      brandSlug: slug,
      provider: 'shopify',
      input: {
        status: 'connected',
        external_account_id: pending.shop,
        access_token: pending.token,
      },
    })
    await clearPendingCookie()
    return { ok: true }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}

export async function createBrand(input: unknown): Promise<ActionResult<BrandProfile>> {
  const parsed = BrandCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' }
  }

  const { token, error } = await resolveToken()
  if (!token) return { ok: false, error }

  try {
    const brand = await createBrandRequest(token, parsed.data)
    return { ok: true, data: brand }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}

export async function updateBrand(
  slug: string,
  input: unknown,
): Promise<ActionResult<BrandProfile>> {
  const parsed = BrandUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' }
  }

  const { token, error } = await resolveToken()
  if (!token) return { ok: false, error }

  try {
    const brand = await updateBrandRequest(token, slug, parsed.data)
    return { ok: true, data: brand }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}

export async function deleteBrand(slug: string): Promise<ActionResult> {
  const { token, error } = await resolveToken()
  if (!token) return { ok: false, error }

  try {
    await deleteBrandRequest(token, slug)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}

export async function saveConnection(
  slug: string,
  provider: string,
  input: unknown,
): Promise<ActionResult<Connection>> {
  const providerParsed = ConnectionProviderSchema.safeParse(provider)
  if (!providerParsed.success) return { ok: false, error: 'Unknown integration provider.' }

  const parsed = ConnectionUpsertSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Check the details and try again.',
    }
  }

  const { token, error } = await resolveToken()
  if (!token) return { ok: false, error }

  try {
    const connection = await upsertConnectionRequest(token, {
      brandSlug: slug,
      provider: providerParsed.data,
      input: parsed.data,
    })
    return { ok: true, data: connection }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}

export async function removeConnection(slug: string, provider: string): Promise<ActionResult> {
  const providerParsed = ConnectionProviderSchema.safeParse(provider)
  if (!providerParsed.success) return { ok: false, error: 'Unknown integration provider.' }

  const { token, error } = await resolveToken()
  if (!token) return { ok: false, error }

  try {
    await deleteConnectionRequest(token, slug, providerParsed.data)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: describe(err) }
  }
}
