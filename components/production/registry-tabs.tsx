'use client'

import type { JSX } from 'react'

import { ComponentRegistryTable } from '@/components/production/component-registry-table'
import { DesignRegistryTable } from '@/components/production/design-registry-table'
import { DesignTemplatesProvider } from '@/components/production/design-templates-context'
import { ProductRegistryPanel } from '@/components/production/product-registry-panel'
import { SKUPipelinePanel } from '@/components/production/sku-pipeline-panel'
import { Tabs, type TabItem } from '@/components/ui/tabs'
import { useQueryTab } from '@/hooks/use-query-tab'
import type { InventoryItem } from '@/lib/validators/inventory'
import type { DesignTemplate, RegistryProductDetail } from '@/lib/validators/registry'

interface RegistryTabsProps {
  brand: string
  components: InventoryItem[]
  products: RegistryProductDetail[]
  templates: DesignTemplate[]
  /**
   * Which tabs this page carries. All four when omitted.
   *
   * The registry is authored under Designs, where the files and the products
   * that print from them live together. Production keeps the two halves the
   * floor reads - which file a SKU prints from, and which slicer settings it
   * prints with - without the authoring beside them.
   */
  only?: readonly string[]
}

const COMPONENTS_TAB = 'components'
const PRODUCTS_TAB = 'products'
const DESIGNS_TAB = 'designs'
const SLICING_TAB = 'slicing'

/** What Production carries: the file a SKU prints from, and how it slices. */
export const PRODUCTION_TABS = [DESIGNS_TAB, SLICING_TAB] as const

/**
 * The registry, split by what kind of thing is being described.
 *
 * A registry is master data: not what happened, but what things ARE. Components
 * are the parts a product is made of; Products are the things sold and the
 * options they come in; Designs are the files that print them. Each answers a
 * different question, which is why they are tabs rather than filters over one
 * list.
 *
 * Designs keep a tab of their own because one template usually prints several
 * variants - swapping dnp_two_heart changes every two-heart variant at once -
 * so a file shown once per product that uses it would invite editing the
 * "wrong" copy of something that has only one. Products link TO a design; they
 * do not own it.
 *
 * Products is the default: it is what somebody opens this page to look at, and
 * the others exist to serve it - a bill of materials points at Components, a
 * variant prints from a Design, and Slicing says which settings each SKU is
 * printed with.
 */
export function RegistryTabs({
  brand,
  components,
  products,
  templates,
  only,
}: RegistryTabsProps): JSX.Element {
  const all: TabItem[] = [
    { value: PRODUCTS_TAB, label: 'Products', count: products.length },
    { value: COMPONENTS_TAB, label: 'Components', count: components.length },
    { value: DESIGNS_TAB, label: 'Designs', count: templates.length },
    // No count: the number worth knowing is how many SKUs are still on the
    // class default, and that is not known until the tab has loaded.
    { value: SLICING_TAB, label: 'Slicing' },
  ]
  const tabs = only ? all.filter(t => only.includes(t.value)) : all

  const [tab, setTab] = useQueryTab<string>('tab', tabs[0]?.value ?? PRODUCTS_TAB)
  // A ?tab= this page does not carry falls back to its first, rather than
  // rendering a page with a tab bar and nothing under it. It happens whenever
  // somebody follows a link to the full registry from the narrower one.
  const active = tabs.some(t => t.value === tab) ? tab : (tabs[0]?.value ?? PRODUCTS_TAB)

  return (
    <div className="flex flex-col gap-4">
      <Tabs tabs={tabs} value={active} onValueChange={setTab} label="Choose a registry" />

      {/* The provider wraps BOTH panels that choose a design file. It used to
          wrap only the products one; a component that is printed here names a
          design file too, and without this its picker would silently offer an
          empty list rather than fail. */}
      <DesignTemplatesProvider templates={templates}>
        {active === COMPONENTS_TAB ? (
          <ComponentRegistryTable brand={brand} items={components} />
        ) : null}

        {active === PRODUCTS_TAB ? (
          <ProductRegistryPanel brand={brand} products={products} components={components} />
        ) : null}
      </DesignTemplatesProvider>

      {active === DESIGNS_TAB ? <DesignRegistryTable brand={brand} templates={templates} /> : null}

      {/* Its own tab, not a control inside each product: the job is usually
          "these twenty SKUs all print with DNP-H2C", which a per-product panel
          would turn into twenty visits. */}
      {active === SLICING_TAB ? <SKUPipelinePanel brand={brand} /> : null}
    </div>
  )
}
