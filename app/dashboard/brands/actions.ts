'use server'

import { headers } from 'next/headers'

import { auth } from '@/lib/auth'
import { createLogger } from '@/lib/logger'
import { type BrandProfile, BrandUpdateSchema } from '@/lib/validators/brands'
import { BrandServiceError, updateBrand as updateBrandRequest } from '@/services/brands.service'

const log = createLogger('BrandActions')

export interface ActionResult<T = undefined> {
  ok: boolean
  error?: string
  data?: T
}

function describe(error: unknown): string {
  if (error instanceof BrandServiceError) return error.message
  log.error({ err: error }, 'Unexpected error in a brand action')
  return 'Something went wrong. Please try again.'
}

export async function updateBrand(
  key: string,
  input: unknown,
): Promise<ActionResult<BrandProfile>> {
  const parsed = BrandUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' }
  }

  // Identity is re-resolved server-side; the backend enforces brand:manage.
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session) return { ok: false, error: 'Your session has expired. Sign in again.' }

  const token = await auth.api.getToken({ headers: requestHeaders })
  if (!token?.token) return { ok: false, error: 'Could not mint an access token. Sign in again.' }

  try {
    const brand = await updateBrandRequest(token.token, key, parsed.data)
    return { ok: true, data: brand }
  } catch (error) {
    return { ok: false, error: describe(error) }
  }
}
