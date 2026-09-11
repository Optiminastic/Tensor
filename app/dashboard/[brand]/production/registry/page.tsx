import type { Metadata } from 'next'
import type { JSX } from 'react'

import { RegistryTabs } from '@/components/production/registry-tabs'
import { requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import type { InventoryItem } from '@/lib/validators/inventory'
import type { DesignTemplate, RegistryProductDetail } from '@/lib/validators/registry'
import { InventoryServiceError, listInventoryItems } from '@/services/inventory.service'
import {
  getRegistryProduct,
  listDesignTemplates,
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
 * Every other page in Production is a record of work - orders that arrived, jobs
 * that were made, beds that printed. This one is the master data underneath:
 * which parts exist and what one costs, which products are sold and in what
 * variants, and which file prints each of them. Designs keep a tab of their
 * own because one template usually prints several variants; a product links to
 * a design rather than owning a copy of it.
 *
 * It matters because that knowledge currently lives in Go constants and three
 * embedded .scad files, so adding a colour or a heart count means a developer,
 * a recompile and a deploy. Everything here is meant to be edited by the people
 * who actually know the answers.
 *
 * Guarded on config:read rather than a permission of its own - the registry is
 * configuration in the sense that permission already names, "cost assumptions,
 * materials and machines". The Components tab's own writes still go through the
 * inventory endpoints and their filament:manage guard.
 */
export default async function RegistryPage({ params }: RegistryPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('config:read', `/dashboard/${brand}`)

  let components: InventoryItem[] = []
  let products: RegistryProductDetail[] = []
  let templates: DesignTemplate[] = []
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
    // Each product's full definition, so the Products tab can render its axes
    // and variants without a request per click. There are a handful of
    // products, not a catalogue - fetching them all is cheaper than the
    // loading state the alternative would need.
    try {
      templates = await listDesignTemplates(token)
    } catch {
      // The Designs tab renders empty rather than failing the page: a missing
      // template list is no reason to hide the parts and products beside it.
      templates = []
    }
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
    <main className="flex w-full flex-col gap-8 px-6 py-10 md:px-8">
      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <h1 className="text-display text-3xl">Registry</h1>
            <p className="text-muted-foreground text-sm">
              What a product is made of, what it is made from, and what one costs.
            </p>
          </div>
          <RegistryTabs
            brand={brand}
            components={components}
            products={products}
            templates={templates}
          />
        </>
      )}
    </main>
  )
}
