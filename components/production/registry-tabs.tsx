'use client'

import { useState, type JSX } from 'react'

import { ComponentRegistryTable } from '@/components/production/component-registry-table'
import { DesignRegistryTable } from '@/components/production/design-registry-table'
import { DesignTemplatesProvider } from '@/components/production/design-templates-context'
import { ProductRegistryPanel } from '@/components/production/product-registry-panel'
import { Tabs, type TabItem } from '@/components/ui/tabs'
import type { InventoryItem } from '@/lib/validators/inventory'
import type { DesignTemplate, RegistryProductDetail } from '@/lib/validators/registry'

interface RegistryTabsProps {
  brand: string
  components: InventoryItem[]
  products: RegistryProductDetail[]
  templates: DesignTemplate[]
}

const COMPONENTS_TAB = 'components'
const PRODUCTS_TAB = 'products'
const DESIGNS_TAB = 'designs'

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
 * the other two exist to serve it - a bill of materials points at Components,
 * and a variant prints from a Design.
 */
export function RegistryTabs({
  brand,
  components,
  products,
  templates,
}: RegistryTabsProps): JSX.Element {
  const [tab, setTab] = useState(PRODUCTS_TAB)

  const tabs: TabItem[] = [
    { value: PRODUCTS_TAB, label: 'Products', count: products.length },
    { value: COMPONENTS_TAB, label: 'Components', count: components.length },
    { value: DESIGNS_TAB, label: 'Designs', count: templates.length },
  ]

  return (
    <div className="flex flex-col gap-4">
      <Tabs tabs={tabs} value={tab} onValueChange={setTab} label="Choose a registry" />

      {tab === COMPONENTS_TAB ? <ComponentRegistryTable brand={brand} items={components} /> : null}

      {/* The provider wraps only the products panel, which is where a design
          gets chosen. The Designs tab holds the same list already. */}
      {tab === PRODUCTS_TAB ? (
        <DesignTemplatesProvider templates={templates}>
          <ProductRegistryPanel brand={brand} products={products} />
        </DesignTemplatesProvider>
      ) : null}

      {tab === DESIGNS_TAB ? <DesignRegistryTable brand={brand} templates={templates} /> : null}
    </div>
  )
}
