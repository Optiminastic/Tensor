import type { Metadata } from 'next'
import type { JSX } from 'react'

import { PageHeading } from '@/components/dashboard/page-heading'
import { RegistryTabs } from '@/components/production/registry-tabs'
import { requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import type { InventoryItem } from '@/lib/validators/inventory'
import type { PartFile } from '@/lib/validators/part-files'
import type { DesignTemplate, RegistryProduct } from '@/lib/validators/registry'
import { listDesignTemplates } from '@/services/design-templates.service'
import { InventoryServiceError, listInventoryItems } from '@/services/inventory.service'
import { listPartFiles } from '@/services/part-files.service'
import { listRegistryProducts, RegistryServiceError } from '@/services/registry.service'

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
  let products: RegistryProduct[] = []
  let templates: DesignTemplate[] = []
  let partFiles: PartFile[] = []
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    // In parallel: none of these waits on another, and loading them one after
    // the other made every visit - and every re-render after a save - wait for
    // the sum of all four.
    //
    // The products are the LIST only (code, name, SKU count). The open
    // product's full definition is loaded by the panel on its own
    // (loadProductWorkspace): this page used to fetch every product's
    // definition, one call each, on every load and again after every save.
    const [inv, files, tmpls, prods] = await Promise.allSettled([
      listInventoryItems(token),
      listPartFiles(token),
      listDesignTemplates(token),
      listRegistryProducts(token),
    ])
    if (inv.status === 'fulfilled') {
      components = inv.value
    } else {
      error =
        inv.reason instanceof InventoryServiceError
          ? inv.reason.message
          : 'Could not load the parts list.'
    }
    // A missing file list or template list is no reason to hide the rest of
    // the registry: those tabs render empty instead.
    partFiles = files.status === 'fulfilled' ? files.value : []
    templates = tmpls.status === 'fulfilled' ? tmpls.value : []
    if (prods.status === 'fulfilled') {
      products = prods.value
    } else if (!error) {
      error =
        prods.reason instanceof RegistryServiceError
          ? prods.reason.message
          : 'Could not load the product registry.'
    }
  }

  return (
    // On a wide screen the page is a fixed frame: the title and the tabs stay
    // put, and what is under them scrolls inside its own panels (the product
    // list and the product card each on their own). On a phone the sidebar
    // stacks above, so the page scrolls as a whole as before.
    <main className="flex w-full flex-col gap-4 px-4 pt-4 pb-6 sm:px-6 md:px-8 lg:h-dvh lg:overflow-hidden lg:pt-5 lg:pb-5">
      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
          {error}
        </p>
      ) : (
        <>
          <PageHeading
            compact
            eyebrow="Designs"
            title="Registry"
            description={<>What a product is made of, what it is made from, and what one costs.</>}
          />
          <div className="lg:min-h-0 lg:flex-1">
            <RegistryTabs
              brand={brand}
              components={components}
              products={products}
              templates={templates}
              partFiles={partFiles}
            />
          </div>
        </>
      )}
    </main>
  )
}
