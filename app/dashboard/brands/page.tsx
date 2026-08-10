import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { JSX } from 'react'

import { BrandConnections } from '@/components/brands/brand-connections'
import { BrandEditor } from '@/components/brands/brand-editor'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getSessionSafe, getTokenSafe } from '@/lib/auth'
import { can, currentAuthz } from '@/lib/authz'
import { env } from '@/lib/env'
import type { BrandProfile } from '@/lib/validators/brands'
import type { Connection } from '@/lib/validators/connections'
import { listBrands } from '@/services/brands.service'
import { listConnections } from '@/services/connections.service'

export const metadata: Metadata = { title: 'Brands' }

export const dynamic = 'force-dynamic'

/**
 * Where an admin creates and edits brands. Each brand is user-created (slug,
 * logo, pricing policy) and carries its own ad/commerce connections. Editing a
 * ladder or threshold here is exactly what the pricing engine reads.
 * Authorization is decided by Tensor-Core (`brand:read` / `brand:manage`).
 */
export default async function BrandsPage(): Promise<JSX.Element> {
  const requestHeaders = await headers()
  const session = await getSessionSafe(requestHeaders)
  if (!session) redirect('/login?callbackUrl=/dashboard/brands')

  let brands: BrandProfile[] = []
  let connectionsByBrand: Connection[][] = []
  let loadError: string | null = null

  const googleOAuthConfigured = Boolean(
    env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET,
  )

  try {
    const token = await getTokenSafe(requestHeaders)
    if (token?.token) {
      brands = await listBrands(token.token)
      connectionsByBrand = await Promise.all(
        brands.map(brand => listConnections(token.token, brand.slug).catch(() => [])),
      )
    }
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Could not load brands.'
  }

  const canManageBrands = can(await currentAuthz(), 'brand:manage')

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-display text-4xl">Brands</h1>
          <p className="text-muted-foreground max-w-prose text-sm text-pretty">
            Each brand&apos;s price ladder and CP thresholds drive the pricing engine. Edit them
            here and every new selling price uses the change.
          </p>
        </div>
        {canManageBrands ? (
          <Link href="/create-brand" className={buttonVariants()}>
            New brand
          </Link>
        ) : null}
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
              No brands yet. Create your first brand to start pricing.
            </p>
          </CardContent>
        </Card>
      ) : (
        brands.map((brand, i) => (
          <div key={brand.id} className="flex flex-col gap-4">
            <BrandEditor brand={brand} />
            <BrandConnections
              brandSlug={brand.slug}
              connections={connectionsByBrand[i] ?? []}
              googleOAuthConfigured={googleOAuthConfigured}
            />
          </div>
        ))
      )}
    </main>
  )
}
