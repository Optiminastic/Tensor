import type { Metadata } from 'next'
import type { JSX } from 'react'

import { isAllBrands } from '@/components/dashboard/nav-config'
import type { BrandChoice } from '@/components/designs/design-upload-form'
import { DesignsView } from '@/components/designs/designs-view'
import { ShopifyImportDialog } from '@/components/designs/shopify-import-dialog'
import { UploadDesignDialog } from '@/components/designs/upload-design-dialog'
import { requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import {
  emptyDesignsMessage,
  filterDesignsByView,
  resolveDesignView,
} from '@/lib/designs/view-filter'
import type { Design } from '@/lib/validators/designs'
import { listBrands } from '@/services/brands.service'
import { DesignServiceError, listDesigns } from '@/services/designs.service'

export const metadata: Metadata = { title: 'Designs' }

interface DesignsPageProps {
  params: Promise<{ brand: string }>
  searchParams: Promise<{ view?: string }>
}

/**
 * A brand's designs: upload a model to run the pre-check, and track every design
 * from queued through the Green/Yellow/Red verdict. The `?view=` param scopes the
 * list to a lifecycle stage (drafts, submitted, approved, archived).
 */
export default async function DesignsPage({
  params,
  searchParams,
}: DesignsPageProps): Promise<JSX.Element> {
  const { brand } = await params
  const view = resolveDesignView((await searchParams).view)
  await requirePermission('design:read', `/dashboard/${brand}`)
  const global = isAllBrands(brand)

  let designs: Design[] = []
  let brandOptions: BrandChoice[] = []
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      designs = await listDesigns(token, brand)
      // In the global view, offer the caller's brands so a new design has a home.
      if (global) {
        brandOptions = (await listBrands(token)).map(item => ({
          slug: item.slug,
          name: item.name,
        }))
      }
    } catch (err) {
      error = err instanceof DesignServiceError ? err.message : 'Could not load designs.'
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-display text-3xl">Designs</h1>
          <p className="text-muted-foreground text-sm">
            Upload a model, get the Green/Yellow/Red pre-check, and iterate until it is green.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Importing a Shopify listing needs one brand's store; offered per brand only. */}
          {global ? null : <ShopifyImportDialog brand={brand} />}
          <UploadDesignDialog brand={brand} brandOptions={global ? brandOptions : undefined} />
        </div>
      </div>

      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : (
        <DesignsView
          brand={brand}
          designs={filterDesignsByView(designs, view)}
          emptyMessage={emptyDesignsMessage(view)}
        />
      )}
    </main>
  )
}
