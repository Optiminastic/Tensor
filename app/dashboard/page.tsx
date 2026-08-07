import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { JSX } from 'react'

import { auth } from '@/lib/auth'
import { can, currentAuthz } from '@/lib/authz'
import { listBrands } from '@/services/brands.service'

export const dynamic = 'force-dynamic'

/**
 * Bare /dashboard has no content of its own: it forwards to the last-used brand
 * (cookie) or the first brand. With no brands, an admin (`brand:manage`) is sent
 * to onboarding, while a member without brand access sees a "no access yet"
 * notice - a member must never be pushed into creating a brand.
 */
export default async function DashboardPage(): Promise<JSX.Element> {
  const token = await auth.api.getToken({ headers: await headers() })
  const brands = token?.token ? await listBrands(token.token).catch(() => []) : []

  if (brands.length === 0) {
    if (can(await currentAuthz(), 'brand:manage')) redirect('/create-brand')
    return <NoBrandAccess />
  }

  const lastBrand = (await cookies()).get('last_brand')?.value ?? null
  const target =
    lastBrand && brands.some(brand => brand.slug === lastBrand) ? lastBrand : brands[0].slug
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
