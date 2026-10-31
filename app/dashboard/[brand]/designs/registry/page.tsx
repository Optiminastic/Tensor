import type { Metadata } from 'next'
import type { JSX } from 'react'

import { PageHeading } from '@/components/dashboard/page-heading'
import { RegistryTabs } from '@/components/production/registry-tabs'
import { requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import type { InventoryItem } from '@/lib/validators/inventory'
import type { PartFile } from '@/lib/validators/part-files'
import type { DesignTemplate, RegistryProductDetail } from '@/lib/validators/registry'
import { listDesignTemplates } from '@/services/design-templates.service'
import { InventoryServiceError, listInventoryItems } from '@/services/inventory.service'
import { listPartFiles } from '@/services/part-files.service'
import {
  getRegistryProduct,
  listRegistryProducts,
  RegistryServiceError,
} from '@/services/registry.service'

export const metadata: Metadata = { title: 'Registry' }

interface RegistryPageProps {
  params: Promise<{ brand: string }>
}

/**
 * The registry: what things ARE, as against what happened to them.
 *
 * It lives under Designs because that is what authoring it is. A product links
 * to a design file, a design file is filled from a customer's answers, and a
 * component is a printed part with files of its own - every one of those is a
 * decision about what the shop makes, taken by whoever knows the models.
 *
 * Production keeps the two halves the floor reads, at
 * /production/slicing-settings: which file a SKU prints from, and which slicer
 * settings it prints with. Same data, same endpoints, same guard - a narrower
 * page, not a second copy.
 *
 * NOTHING ON THE PRODUCTION PIPELINE DEPENDS ON WHERE THESE PAGES SIT. The
 * render path reads the database through FindProductBySKU, never through a
 * screen, so moving the authoring does not move what prints.
 *
 * Guarded on registry:read. Writing it is registry:manage, and the backend
 * withholds parts_cost/line_cost from a caller without config:read, so a role
 * that can open this page still cannot read prices off it.
 */
export default async function DesignRegistryPage({
  params,
}: RegistryPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('registry:read', `/dashboard/${brand}`)

  let components: InventoryItem[] = []
  let products: RegistryProductDetail[] = []
  let templates: DesignTemplate[] = []
  let partFiles: PartFile[] = []
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      components = await listInventoryItems(token)
    } catch (err) {
      error = err instanceof InventoryServiceError ? err.message : 'Could not load the parts list.'
    }
    try {
      partFiles = await listPartFiles(token)
    } catch {
      // Same reasoning as the templates below: one missing list is no reason
      // to hide the rest of the registry.
      partFiles = []
    }
    try {
      templates = await listDesignTemplates(token)
    } catch {
      // The Designs tab renders empty rather than failing the page: a missing
      // template list is no reason to hide the parts and products beside it.
      templates = []
    }
    // Each product's full definition, so the Products tab can render its
    // variants without a request per click. There are a handful of products,
    // not a catalogue.
    try {
      const summaries = await listRegistryProducts(token)
      products = await Promise.all(summaries.map(p => getRegistryProduct(token, p.code)))
    } catch (err) {
      if (!error) {
        error =
          err instanceof RegistryServiceError ? err.message : 'Could not load the product registry.'
      }
    }
  }

  return (
    <main className="flex w-full flex-col gap-8 px-4 py-10 sm:px-6 md:px-8">
      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
          {error}
        </p>
      ) : (
        <>
          <PageHeading
            eyebrow="Designs"
            title="Registry"
            description={<>What a product is made of, what it is made from, and what one costs.</>}
          />
          <RegistryTabs
            brand={brand}
            components={components}
            products={products}
            templates={templates}
            partFiles={partFiles}
          />
        </>
      )}
    </main>
  )
}
