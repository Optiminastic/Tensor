'use client'

import { ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState, type JSX } from 'react'

import {
  loadProductWorkspace,
  type ProductWorkspace,
} from '@/app/dashboard/[brand]/production/registry-actions'
import { DesignFieldsPanel } from '@/components/production/design-fields-panel'
import { PhotoPrintPanel } from '@/components/production/photo-print-panel'
import { PreviewDesignPanel } from '@/components/production/preview-design-panel'
import { ProductComponentsPanel } from '@/components/production/product-components-panel'
import { ProductDeleteDialog } from '@/components/production/product-delete-dialog'
import { ProductDetailSkeleton } from '@/components/production/product-detail-skeleton'
import { ProductFormDialog } from '@/components/production/product-form-dialog'
import { ProductImportDialog } from '@/components/production/product-import-dialog'
import { ProductPersonalisationToggle } from '@/components/production/product-personalisation-toggle'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Disclosure } from '@/components/ui/disclosure'
import { useQueryTab } from '@/hooks/use-query-tab'
import { cn } from '@/lib/utils'
import type { InventoryItem } from '@/lib/validators/inventory'
import type { RegistryProduct, RegistryProductDetail } from '@/lib/validators/registry'

interface ProductRegistryPanelProps {
  brand: string
  /** The product list (code, name, SKU count). */
  products: RegistryProduct[]
  /** The shelf, passed through to the components list on each product. */
  components: InventoryItem[]
}

const FIGURE = 'font-mono tabular-nums'

/**
 * What each product is, which SKUs it covers, and what those print from.
 *
 * Master/detail rather than one flat table, because a product has as many SKUs
 * as its colours and options multiply out to - sixty-four on the largest live
 * one. A flat list would repeat the product on every row and still not say
 * which file any of them renders from.
 *
 * The configuration here is the point: a template and a field mapping per
 * product is what stops adding a product being a code change. That knowledge
 * used to live in Go constants and three embedded .scad files, so changing it
 * meant a developer, a recompile and a deploy.
 */
export function ProductRegistryPanel({
  brand,
  products,
  components,
}: ProductRegistryPanelProps): JSX.Element {
  // The open product lives in the URL (?product=SNP), so a link, a refresh or
  // Back returns to it. Mirrored with the history API like the tab beside it:
  // switching products costs no server round trip.
  const codes = products.map(p => p.code)
  const [selected, setSelected] = useQueryTab<string>('product', codes[0] ?? '', codes)
  const product = products.find(p => p.code === selected) ?? products[0]
  const detail = useProductDetail(brand, product?.code ?? '', products)

  const addProductButton = (
    <ProductImportDialog
      brand={brand}
      trigger={
        <Button variant="secondary" size="sm" className="w-full">
          <Plus className="size-3.5" aria-hidden />
          Add product
        </Button>
      }
    />
  )

  if (products.length === 0) {
    return (
      <Card className="flex flex-col items-start gap-3 px-5 py-4">
        <p className="text-muted-foreground text-sm">
          No products registered yet. A product comes from Shopify with its SKUs — those are what an
          order is matched to it by.
        </p>
        <ProductImportDialog
          brand={brand}
          trigger={
            <Button size="sm">
              <Plus className="size-3.5" aria-hidden />
              Add product
            </Button>
          }
        />
      </Card>
    )
  }

  return (
    // Two columns that each scroll on their own under the fixed title and tabs
    // (wide screens): the list on the left, the open product on the right.
    <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:flex-row">
      {/* The product list. Narrow and fixed: there are a handful of real
          products, and giving them half the page would say otherwise. */}
      <div className="flex shrink-0 flex-col gap-2 lg:min-h-0 lg:w-56">
        <nav
          className="scrollbar-thin flex flex-col gap-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1"
          aria-label="Products"
        >
          {products.map(p => (
            <button
              key={p.code}
              type="button"
              onClick={() => setSelected(p.code)}
              className={cn(
                'border-border flex flex-col gap-0.5 rounded-md border px-3 py-2 text-left',
                p.code === product?.code ? 'bg-surface-muted border-l-accent border-l-2' : '',
              )}
            >
              <span className="font-mono text-sm font-medium">{p.code}</span>
              <span className="text-muted-foreground text-xs">{p.name}</span>
              <span className="text-subtle-foreground text-xs">
                {p.variant_count} SKU{p.variant_count === 1 ? '' : 's'}
              </span>
            </button>
          ))}
        </nav>
        {addProductButton}
      </div>

      {detail.workspace ? (
        // Keyed by product: its panels start from the data loaded with it
        // rather than re-reading it, and a different product starts fresh.
        <ProductDetail
          key={detail.workspace.product.code}
          brand={brand}
          workspace={detail.workspace}
          components={components}
        />
      ) : detail.error ? (
        <Card className="text-danger flex min-w-0 flex-1 p-4 text-sm lg:self-start" role="alert">
          {detail.error}
        </Card>
      ) : (
        <ProductDetailSkeleton />
      )}
    </div>
  )
}

interface ProductDetailState {
  workspace: ProductWorkspace | null
  error: string | null
}

/**
 * The open product's full definition, with its parts and preview files - one
 * combined call (loadProductWorkspace), read on its own.
 *
 * Read again whenever the page re-renders after a save - the product list is a
 * new array then - so what is shown is never older than the last write. That is
 * one backend call for the open product; the page used to re-read every
 * product's definition after every save. The previous definition stays on
 * screen while the new one loads, so a save does not blank the card.
 */
function useProductDetail(
  brand: string,
  code: string,
  products: RegistryProduct[],
): ProductDetailState {
  const [state, setState] = useState<ProductDetailState>({ workspace: null, error: null })
  useEffect(() => {
    if (!code) return
    let cancelled = false
    void loadProductWorkspace(brand, code).then(res => {
      if (cancelled) return
      setState(prev =>
        res.ok && res.data
          ? { workspace: res.data, error: null }
          : {
              workspace: prev.workspace?.product.code === code ? prev.workspace : null,
              error: res.error ?? 'Could not load that product.',
            },
      )
    })
    return () => {
      cancelled = true
    }
  }, [brand, code, products])
  // A product other than the open one is never shown, even for a moment.
  return state.workspace && state.workspace.product.code !== code
    ? { workspace: null, error: null }
    : state
}

interface ProductDetailProps {
  brand: string
  /** The product with the parts and preview files loaded alongside it. */
  workspace: ProductWorkspace
  /** The shelf, for the components picker. */
  components: InventoryItem[]
}

function ProductDetail({ brand, workspace, components }: ProductDetailProps): JSX.Element {
  const { product } = workspace
  // Design and fields open by default: it is the only thing on this card
  // somebody can act on, and a product that renders nothing says so there.
  // The SKU list is closed, because it can be sixty-four rows long and
  // reading it is checking work rather than doing it.
  const [showDesign, setShowDesign] = useState(true)
  const [showComponents, setShowComponents] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showPhotoPrint, setShowPhotoPrint] = useState(false)

  return (
    <Card className="scrollbar-thin flex min-w-0 flex-1 flex-col gap-3 p-4 lg:min-h-0 lg:overflow-y-auto">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="text-lg font-medium">{product.name}</h2>
          {/* Whether Tensor renders it or a person supplies the file. It is the
              difference between a plank and a photo frame, and it decides
              whether a job waits for a render or for somebody to upload. */}
          <span className="text-muted-foreground text-xs">
            {product.kind === 'generated' ? 'Rendered by Tensor' : 'Design file supplied'}
            {product.status === 'active' ? '' : ` · ${product.status}`}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {/* One decision for the product, not one per colourway - see
              ProductPersonalisationToggle for why it moved up here. */}
          <ProductPersonalisationToggle
            brand={brand}
            productCode={product.code}
            variants={product.variants}
          />
          <ProductFormDialog
            brand={brand}
            product={product}
            trigger={
              <Button variant="ghost" size="sm">
                <Pencil className="size-3.5" aria-hidden />
                Edit
              </Button>
            }
          />
          <ProductDeleteDialog
            brand={brand}
            product={product}
            trigger={
              <Button variant="ghost" size="sm" aria-label={`Delete ${product.code}`}>
                <Trash2 className="size-3.5" aria-hidden />
              </Button>
            }
          />
        </div>
      </div>

      {product.notes ? <p className="text-muted-foreground text-sm">{product.notes}</p> : null}

      <Disclosure
        label="Design & fields"
        open={showDesign}
        onToggle={() => setShowDesign(open => !open)}
      >
        <DesignFieldsPanel
          brand={brand}
          product={product}
          initialParts={workspace.parts}
          initialPreviews={workspace.previews}
        />
      </Disclosure>

      {/* The file the customer approves, which is not the file that prints.
          Beside the design file rather than below the parts: a product has
          three kinds of file - the one that prints, the one the customer is
          shown, and the ones its parts are made from - and they read as three
          when they are in that order. */}
      <Disclosure
        label="Personalisation preview"
        open={showPreview}
        onToggle={() => setShowPreview(open => !open)}
      >
        <PreviewDesignPanel
          brand={brand}
          productCode={product.code}
          variantSkus={product.variants.flatMap(v => (v.sku ? [v.sku] : []))}
        />
      </Disclosure>

      {/* The size the customer's photo prints at on the Custom Photo A4
          sheets, with a sample PDF. Optional and closed: most products carry
          no photo at all. */}
      <Disclosure
        label="Photo print size (optional)"
        open={showPhotoPrint}
        onToggle={() => setShowPhotoPrint(open => !open)}
      >
        {showPhotoPrint ? <PhotoPrintPanel productCode={product.code} /> : null}
      </Disclosure>

      {/* The pieces that are NOT printed per order: made to stock or bought
          in, and attached at the bench. Closed by default - it is reference
          rather than the thing somebody opened this card to do. */}
      <Disclosure
        label="Components"
        open={showComponents}
        onToggle={() => setShowComponents(open => !open)}
      >
        <ProductComponentsPanel
          brand={brand}
          productCode={product.code}
          components={components}
          variants={product.variants}
        />
      </Disclosure>
    </Card>
  )
}

/** A titled, optionally counted section that opens in place. */
