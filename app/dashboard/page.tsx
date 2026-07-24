import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth'
import { listBrands } from '@/services/brands.service'

export const dynamic = 'force-dynamic'

/**
 * Bare /dashboard has no content of its own: it forwards to the last-used brand
 * (cookie) or the first brand, and to onboarding when there are no brands yet.
 */
export default async function DashboardPage(): Promise<never> {
  const token = await auth.api.getToken({ headers: await headers() })
  const brands = token?.token ? await listBrands(token.token).catch(() => []) : []
  if (brands.length === 0) redirect('/create-brand')

  const lastBrand = (await cookies()).get('last_brand')?.value ?? null
  const target =
    lastBrand && brands.some(brand => brand.slug === lastBrand) ? lastBrand : brands[0].slug
  redirect(`/dashboard/${target}`)
}
