import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { isAllBrands } from '@/components/dashboard/nav-config'
import { getSessionSafe, getTokenSafe } from '@/lib/auth'
import { requirePermission } from '@/lib/authz'
import type { BrandProfile } from '@/lib/validators/brands'
import { listBrands } from '@/services/brands.service'

/**
 * What all three Settings pages need before they can render anything.
 *
 * Shared because the gate and the brand resolution are the same on each, and
 * three copies of "which brand is this about" is three chances for them to
 * disagree - which on a page that deletes brands is not a cosmetic bug.
 */
export interface SettingsContext {
  token: string | null
  brands: BrandProfile[]
  /** The brand these pages are about, or undefined when none is resolvable. */
  profile: BrandProfile | undefined
  loadError: string | null
}

/**
 * Resolves the signed-in admin and the brand in scope.
 *
 * THE BRAND COMES FROM A COOKIE. These routes have no [brand] segment - they
 * are workspace-level - so the brand-scoped pages follow the `last_brand`
 * cookie the dashboard layout writes, which is the brand the user was last
 * looking at. `?brand=` overrides it, which is what the OAuth callbacks use to
 * come back to the right store.
 */
export async function loadSettingsContext(
  brandParam: string | undefined,
  callbackPath: string,
): Promise<SettingsContext> {
  const requestHeaders = await headers()
  await requireSettingsAccess(requestHeaders, callbackPath)

  const token = (await getTokenSafe(requestHeaders))?.token ?? null
  const { brands, loadError } = await loadBrands(token)
  const activeBrand = await resolveBrandSlug(brandParam)

  return {
    token,
    brands,
    profile: activeBrand ? brands.find(brand => brand.slug === activeBrand) : undefined,
    loadError,
  }
}

/**
 * The gate.
 *
 * Deleting brands, editing a brand's pricing ladder and connecting its store
 * are all brand:manage acts, and this area had no check at all before - any
 * signed-in role could open it. Tensor-Core refused the writes, so that was a
 * UI hole rather than a security one, but a Designer being shown a "Delete
 * brand" button is its own kind of wrong.
 */
async function requireSettingsAccess(requestHeaders: Headers, callbackPath: string): Promise<void> {
  const session = await getSessionSafe(requestHeaders)
  if (!session) redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`)
  await requirePermission('brand:manage', '/dashboard')
}

/** `?brand=` first, then the brand the user was last looking at. */
async function resolveBrandSlug(brandParam: string | undefined): Promise<string | null> {
  if (brandParam) return brandParam
  const lastBrand = (await cookies()).get('last_brand')?.value ?? null
  // The "all brands" sentinel is not a brand, and these pages each act on
  // exactly one - so it resolves to none rather than to the first in the list.
  return isAllBrands(lastBrand) ? null : lastBrand
}

async function loadBrands(
  token: string | null,
): Promise<{ brands: BrandProfile[]; loadError: string | null }> {
  if (!token) return { brands: [], loadError: null }
  try {
    return { brands: await listBrands(token), loadError: null }
  } catch (error) {
    return {
      brands: [],
      loadError: error instanceof Error ? error.message : 'Could not load brands.',
    }
  }
}
