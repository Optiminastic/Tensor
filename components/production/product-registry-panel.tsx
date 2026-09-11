'use client'

import { ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, type JSX } from 'react'

import { OptionEditor } from '@/components/production/option-editor'
import { ProductDeleteDialog } from '@/components/production/product-delete-dialog'
import { ProductFormDialog } from '@/components/production/product-form-dialog'
import { VariantTable } from '@/components/production/variant-table'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { RegistryProductDetail } from '@/lib/validators/registry'

interface ProductRegistryPanelProps {
  brand: string
  products: RegistryProductDetail[]
}

const FIGURE = 'font-mono tabular-nums'

/**
 * What each product is, every variant its options make, and the files that
 * print them.
 *
 * Master/detail rather than one flat table, because the interesting object is a
 * VARIANT and there are as many of those as the options multiply out to - six
 * for the plank today, and more the moment colour joins them. A flat list would
 * repeat the product on every row and still not show the axes.
 *
 * Everything here is editable on purpose. The point of a registry is that a new
 * colour or a new heart count stops being a code change: that knowledge used to
 * live in Go constants and three embedded .scad files, so changing it meant a
 * developer, a recompile and a deploy.
 */
export function ProductRegistryPanel({ brand, products }: ProductRegistryPanelProps): JSX.Element {
  const [selected, setSelected] = useState(products[0]?.code ?? '')
  const product = useMemo(
    () => products.find(p => p.code === selected) ?? products[0],
    [products, selected],
  )

  const addProductButton = (
    <ProductFormDialog
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
          No products registered yet. A product is a family like DNP — its option axes, the variants
          they make, and the parts each one carries.
        </p>
        <ProductFormDialog
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
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* The product list. Narrow and fixed: there are a handful of real
          products, and giving them half the page would say otherwise. */}
      <div className="flex shrink-0 flex-col gap-2 lg:w-56">
        <nav className="flex flex-col gap-1" aria-label="Products">
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
                {p.option_count} options · {p.variant_count} variants
              </span>
            </button>
          ))}
        </nav>
        {addProductButton}
      </div>

      {product ? <ProductDetail brand={brand} product={product} /> : null}
    </div>
  )
}

interface ProductDetailProps {
  brand: string
  product: RegistryProductDetail
}

function ProductDetail({ brand, product }: ProductDetailProps): JSX.Element {
  // Closed by default. The options are what somebody comes to this panel to
  // read - three lines that say what the product IS - and six variants opened
  // beneath them buried that under a table. Six is also only today's number:
  // colour has not joined the axes yet, and when it does this becomes
  // fifty-four rows.
  const [showVariants, setShowVariants] = useState(false)

  return (
    <Card className="flex min-w-0 flex-1 flex-col gap-3 p-4">
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
        <div className="flex shrink-0 items-center gap-1">
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

      <OptionEditor brand={brand} productCode={product.code} options={product.options} />

      <Disclosure
        label="Variants"
        count={product.variants.length}
        open={showVariants}
        onToggle={() => setShowVariants(open => !open)}
      >
        <VariantTable
          brand={brand}
          productCode={product.code}
          options={product.options}
          variants={product.variants}
        />
      </Disclosure>
    </Card>
  )
}

interface DisclosureProps {
  label: string
  count: number
  open: boolean
  onToggle: () => void
  children: JSX.Element
}

/** A titled, counted section that opens in place. */
function Disclosure({ label, count, open, onToggle, children }: DisclosureProps): JSX.Element {
  return (
    <div className="border-border flex flex-col border-t pt-3">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left"
      >
        <ChevronRight
          className={cn('size-4 shrink-0 transition-transform', open && 'rotate-90')}
          aria-hidden
        />
        <span className="text-sm font-medium">{label}</span>
        <span className={`text-muted-foreground text-xs ${FIGURE}`}>{count}</span>
      </button>
      {open ? children : null}
    </div>
  )
}
