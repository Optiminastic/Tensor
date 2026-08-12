import type { Metadata } from 'next'
import { headers } from 'next/headers'
import type { JSX } from 'react'

import { BrandEditor } from '@/components/brands/brand-editor'
import { isAllBrands } from '@/components/dashboard/nav-config'
import { PickABrandNotice } from '@/components/dashboard/pick-a-brand-notice'
import { Card, CardContent } from '@/components/ui/card'
import { getTokenSafe } from '@/lib/auth'
import { requirePermission } from '@/lib/authz'
import type { BrandProfile } from '@/lib/validators/brands'
import { listBrands } from '@/services/brands.service'

export const metadata: Metadata = { title: 'Brand settings' }

export const dynamic = 'force-dynamic'

interface BrandSettingsPageProps {
  params: Promise<{ brand: string }>
}

/**
 * This brand's settings: identity, pricing ladder, CP thresholds and the danger
 * zone that deletes the brand. It edits exactly the active brand (unlike the
 * workspace Settings page, which lists every brand). Editing and deleting are
 * enforced by Tensor-Core (`brand:manage`).
 */
export default async function BrandSettingsPage({
  params,
}: BrandSettingsPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('brand:manage', `/dashboard/${brand}`)
  if (isAllBrands(brand)) {
    return (
      <PickABrandNotice
        section="Brand settings"
        reason="Settings apply to a single brand's identity and pricing."
      />
    )
  }

  const token = await getTokenSafe(await headers())
  let brands: BrandProfile[] = []
  let loadError: string | null = null
  try {
    if (token?.token) brands = await listBrands(token.token)
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Could not load the brand.'
  }
  const profile = brands.find(b => b.slug === brand)

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-3xl">Brand settings</h1>
        <p className="text-muted-foreground text-sm">
          This brand&apos;s identity, pricing ladder, CP thresholds and danger zone.
        </p>
      </div>
      {loadError ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {loadError}
        </p>
      ) : profile ? (
        <BrandEditor brand={profile} />
      ) : (
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              This brand could not be found, or you do not have access to it.
            </p>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
