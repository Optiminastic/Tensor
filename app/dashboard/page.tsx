import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { JSX } from 'react'

import { ALL_BRANDS, isAllBrands } from '@/components/dashboard/nav-config'
import { RetryButton } from '@/components/dashboard/retry-button'
import { getTokenSafe } from '@/lib/auth'
import { can, currentAuthz } from '@/lib/authz'
import type { BrandProfile } from '@/lib/validators/brands'
import { BrandServiceError, listBrands } from '@/services/brands.service'

export const dynamic = 'force-dynamic'

/**
 * Bare /dashboard has no content of its own: it forwards to the last-used brand
 * (cookie) or the first brand. With no brands, an admin (`brand:manage`) is sent
 * to onboarding, while a member without brand access sees a "no access yet"
 * notice - a member must never be pushed into creating a brand.
 *
 * A backend outage is handled separately from "no brands": when Tensor-Core is
 * unreachable, listBrands throws, and collapsing that into an empty list would
 * mislabel a transient outage as "no brand access" even for an admin. Instead we
 * show a distinct, retryable state.
 */
export default async function DashboardPage(): Promise<JSX.Element> {
  const token = await getTokenSafe(await headers())
  if (!token?.token) redirect('/login')

  let brands: BrandProfile[]
  try {
    brands = await listBrands(token.token)
  } catch (error) {
    // Only a backend/transport failure lands here (a member with no brands gets a
    // successful empty list, not an error). Re-throw anything unexpected.
    if (!(error instanceof BrandServiceError)) throw error
    return <WorkspaceUnavailable />
  }

  if (brands.length === 0) {
    if (can(await currentAuthz(), 'brand:manage')) redirect('/create-brand')
    return <NoBrandAccess />
  }

  // Global "All brands" by default; a remembered specific brand wins so returning
  // users land back where they left off.
  const lastBrand = (await cookies()).get('last_brand')?.value ?? null
  const target =
    lastBrand && (isAllBrands(lastBrand) || brands.some(brand => brand.slug === lastBrand))
      ? lastBrand
      : ALL_BRANDS
  redirect(`/dashboard/${target}`)
}

/** Shown to a member who has no brands assigned yet: they wait for an admin. */
function NoBrandAccess(): JSX.Element {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <h1 className="text-display text-3xl">No brand access yet</h1>
      <p className="text-muted-foreground max-w-prose text-sm text-pretty">
        You have not been assigned to any brand. Ask an administrator to give you access, then
        refresh this page.
      </p>
    </main>
  )
}

/**
 * Shown when Tensor-Core could not be reached. This is a transient infrastructure
 * state (the service is starting, restarting, or briefly down), not a permissions
 * decision - so it must never read as "you have no access".
 */
function WorkspaceUnavailable(): JSX.Element {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <h1 className="text-display text-3xl">Workspace unavailable</h1>
      <p className="text-muted-foreground max-w-prose text-sm text-pretty">
        We could not reach the service. It may be starting up - wait a moment, then try again.
      </p>
      <RetryButton />
    </main>
  )
}
