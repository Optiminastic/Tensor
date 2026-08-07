import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth'
import { createLogger } from '@/lib/logger'
import { listBrands } from '@/services/brands.service'

export const dynamic = 'force-dynamic'

const log = createLogger('DashboardPage')

/**
 * Bare /dashboard has no content of its own: it forwards to the last-used brand
 * (cookie) or the first brand, and to onboarding when there are no brands yet.
 */
export default async function DashboardPage(): Promise<never> {
  // Middleware only checks that a session cookie is present, not that it's
  // still valid - getToken does the real DB-backed check and can throw
  // (expired/invalid session). That means "not signed in", same as
  // middleware's own redirect - not "signed in with zero brands" below.
  let token: Awaited<ReturnType<typeof auth.api.getToken>> | null
  try {
    token = await auth.api.getToken({ headers: await headers() })
  } catch (error) {
    log.error({ err: error }, 'getToken threw; treating as unauthenticated')
    redirect('/login')
  }
  const brands = token?.token ? await listBrands(token.token).catch(() => []) : []
  if (brands.length === 0) redirect('/create-brand')

  const lastBrand = (await cookies()).get('last_brand')?.value ?? null
  const target =
    lastBrand && brands.some(brand => brand.slug === lastBrand) ? lastBrand : brands[0].slug
  redirect(`/dashboard/${target}`)
}
