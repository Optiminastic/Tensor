import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { JSX, ReactNode } from 'react'

import type { BrandOption } from '@/components/dashboard/brand-switcher'
import { Sidebar } from '@/components/dashboard/sidebar'
import { getSessionSafe, getTokenSafe } from '@/lib/auth'
import { listBrands } from '@/services/brands.service'

export const dynamic = 'force-dynamic'

interface DashboardLayoutProps {
  children: ReactNode
}

/**
 * The dashboard shell: a brand-aware workflow sidebar beside the page content.
 * Brands feed the switcher; the last-used brand (cookie) is the fallback active
 * brand on workspace pages. The session guard here is UX (mirrored by
 * middleware); real authorization is enforced by Tensor-Core.
 */
export default async function DashboardLayout({
  children,
}: DashboardLayoutProps): Promise<JSX.Element> {
  const requestHeaders = await headers()
  const session = await getSessionSafe(requestHeaders)
  if (!session) redirect('/login?callbackUrl=/dashboard')

  const token = await getTokenSafe(requestHeaders)
  let brands: BrandOption[] = []
  if (token?.token) {
    brands = await listBrands(token.token)
      .then(list => list.map(brand => ({ slug: brand.slug, name: brand.name })))
      .catch(() => [])
  }

  const lastBrand = (await cookies()).get('last_brand')?.value ?? null
  const fallbackBrand =
    (lastBrand && brands.some(brand => brand.slug === lastBrand) ? lastBrand : brands[0]?.slug) ??
    null

  return (
    <div className="flex min-h-dvh">
      <Sidebar email={session.user.email} brands={brands} fallbackBrand={fallbackBrand} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
