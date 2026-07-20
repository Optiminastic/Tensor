import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { JSX } from 'react'

import { BrandEditor } from '@/components/brands/brand-editor'
import { Card, CardContent } from '@/components/ui/card'
import { auth } from '@/lib/auth'
import type { BrandProfile } from '@/lib/validators/brands'
import { listBrands } from '@/services/brands.service'

export const metadata: Metadata = { title: 'Brands' }

export const dynamic = 'force-dynamic'

/**
 * Where an admin edits each brand's identity and pricing policy.
 *
 * Editing a ladder or threshold here is exactly what the pricing engine reads,
 * so this is the "manage pricing ladders" surface. There are two fixed brands,
 * so the page shows one editable card each — no create or delete. Authorization
 * is decided by Tensor-Core (`brand:read` / `brand:manage`).
 */
export default async function BrandsPage(): Promise<JSX.Element> {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session) redirect('/login?callbackUrl=/dashboard/brands')

  let brands: BrandProfile[] = []
  let loadError: string | null = null

  try {
    const token = await auth.api.getToken({ headers: requestHeaders })
    brands = token?.token ? await listBrands(token.token) : []
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Could not load brands.'
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-4xl">Brands</h1>
        <p className="text-muted-foreground max-w-prose text-sm text-pretty">
          Each brand&apos;s price ladder and CP thresholds drive the pricing engine. Edit them here
          and every new selling price uses the change.
        </p>
      </div>

      {loadError ? (
        <Card>
          <CardContent>
            <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
              {loadError}
            </p>
          </CardContent>
        </Card>
      ) : brands.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              No brands are configured yet. Run the brand seed in Tensor-Core.
            </p>
          </CardContent>
        </Card>
      ) : (
        brands.map(brand => <BrandEditor key={brand.id} brand={brand} />)
      )}
    </main>
  )
}
