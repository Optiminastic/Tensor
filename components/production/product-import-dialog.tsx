'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type JSX, type ReactNode } from 'react'

import {
  importProduct,
  loadShopifyCatalogue,
} from '@/app/dashboard/[brand]/production/registry-actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { ShopifyProduct } from '@/lib/validators/shopify-products'

interface ProductImportDialogProps {
  brand: string
  trigger: ReactNode
}

const FIGURE = 'font-mono tabular-nums'

/**
 * Adds a product to the registry by choosing it from Shopify.
 *
 * It used to be three steps of typing: a code, then option axes, then every
 * variant by hand. All three are answers Shopify already holds, and typing
 * them again produces a second answer that can disagree - which is exactly
 * what happened. DNP carried six hand-typed variants named "2 hearts, With
 * light" with no SKUs at all, so no order could ever match it.
 *
 * The SKUs are shown before the import, not after. They are the whole point:
 * a SKU is what an order carries and the only thing a job can be matched to a
 * product by, so a product whose variants carry none can never render, and
 * that is worth seeing while somebody can still go and fix it in Shopify.
 */
export function ProductImportDialog({ brand, trigger }: ProductImportDialogProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [catalogue, setCatalogue] = useState<ShopifyProduct[] | null>(null)
  const [query, setQuery] = useState('')
  const [chosen, setChosen] = useState<ShopifyProduct | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetched on open rather than with the page: most visits to the registry are
  // to read what is already configured, and the catalogue is a live call to
  // Shopify that only somebody about to add something needs.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setError(null)
    setChosen(null)
    setQuery('')
    void loadShopifyCatalogue(brand).then(res => {
      if (cancelled) return
      if (!res.ok) {
        setError(res.error ?? 'Could not read the products from Shopify.')
        setCatalogue([])
        return
      }
      setCatalogue(res.data ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [open, brand])

  const matches = useMemo(() => {
    const all = catalogue ?? []
    const q = query.trim().toLowerCase()
    if (q === '') return all
    return all.filter(
      p =>
        p.title.toLowerCase().includes(q) ||
        (p.variants ?? []).some(v => v.sku.toLowerCase().includes(q)),
    )
  }, [catalogue, query])

  async function save(): Promise<void> {
    if (!chosen) return
    setError(null)
    setPending(true)
    const res = await importProduct(brand, { shopify_product_id: chosen.id })
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not import that product.')
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a product</DialogTitle>
          <DialogDescription>
            Choose it from Shopify. Its SKUs come with it — those are what an order is matched to
            the product by.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Field label="Find a product" htmlFor="import-search">
            <div className="relative">
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
                aria-hidden
              />
              <Input
                id="import-search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Name or SKU"
                className="pl-8"
              />
            </div>
          </Field>

          <CatalogueList
            catalogue={catalogue}
            matches={matches}
            chosen={chosen}
            onChoose={setChosen}
          />

          {chosen ? <ImportPreview product={chosen} /> : null}

          {error ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={pending || !chosen}>
              {pending ? 'Importing…' : 'Import product'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface CatalogueListProps {
  catalogue: ShopifyProduct[] | null
  matches: ShopifyProduct[]
  chosen: ShopifyProduct | null
  onChoose: (product: ShopifyProduct) => void
}

function CatalogueList({ catalogue, matches, chosen, onChoose }: CatalogueListProps): JSX.Element {
  if (catalogue === null) {
    return <p className="text-muted-foreground py-6 text-center text-sm">Reading Shopify…</p>
  }
  if (matches.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        {catalogue.length === 0 ? 'No products in the connected store.' : 'Nothing matches that.'}
      </p>
    )
  }

  return (
    <div className="border-border max-h-64 overflow-y-auto rounded-md border">
      <ul className="divide-border divide-y">
        {matches.map(product => {
          const withSku = (product.variants ?? []).filter(v => v.sku.trim() !== '')
          return (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => onChoose(product)}
                aria-pressed={chosen?.id === product.id}
                className={cn(
                  'flex w-full items-center justify-between gap-3 px-3 py-2 text-left',
                  chosen?.id === product.id ? 'bg-surface-muted border-l-accent border-l-2' : '',
                )}
              >
                <span className="min-w-0 truncate text-sm">{product.title}</span>
                {/* The count, not the SKUs: one line per product keeps this a
                    list you can scan. The SKUs themselves appear below once a
                    product is chosen, where there is room to read them. */}
                <span
                  className={cn(
                    'shrink-0 text-xs',
                    withSku.length === 0 ? 'text-warning' : 'text-muted-foreground',
                    FIGURE,
                  )}
                >
                  {withSku.length === 0 ? 'no SKUs' : `${withSku.length} SKUs`}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * What the import will actually write.
 *
 * The derived code is shown rather than guessed at silently: it is the segment
 * an order's SKU carries, and a product registered under the wrong one matches
 * nothing in a way that looks exactly like no orders having arrived.
 */
function ImportPreview({ product }: { product: ShopifyProduct }): JSX.Element {
  const variants = product.variants ?? []
  const withSku = variants.filter(v => v.sku.trim() !== '')
  const code = derivedCode(product)

  return (
    <div className="border-border flex flex-col gap-2 rounded-md border px-3 py-2.5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-sm font-medium">{product.title}</span>
        <span className={`text-muted-foreground text-xs ${FIGURE}`}>as {code || '—'}</span>
      </div>

      {withSku.length === 0 ? (
        <p className="text-warning text-xs">
          None of this product&rsquo;s variants carry a SKU, so no order could ever be matched to
          it. Add SKUs in Shopify first.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {withSku.map(v => (
            <span
              key={v.id}
              className={`bg-surface-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs ${FIGURE}`}
              title={v.title}
            >
              {v.sku}
            </span>
          ))}
        </div>
      )}

      {variants.length > withSku.length ? (
        <p className="text-muted-foreground text-xs">
          {variants.length - withSku.length} variant
          {variants.length - withSku.length === 1 ? '' : 's'} carry no SKU and will be skipped.
        </p>
      ) : null}
    </div>
  )
}

/**
 * The code the backend will derive, worked out again here so it can be shown
 * before the import rather than reported after it.
 *
 * Deliberately the same rule as `productCodeFor`: the commonest FIRST segment.
 * Only the first, or a colour shared by three variants would outvote the
 * family they all belong to. A tie resolves alphabetically, so this and the
 * backend cannot disagree about which of two equal answers to pick.
 */
function derivedCode(product: ShopifyProduct): string {
  const counts = new Map<string, number>()
  for (const v of product.variants ?? []) {
    const sku = v.sku.trim()
    if (sku === '') continue
    const segment = sku.toUpperCase().split('-')[0]
    if (!segment) continue
    counts.set(segment, (counts.get(segment) ?? 0) + 1)
  }
  let best = ''
  let bestCount = 0
  for (const segment of [...counts.keys()].sort()) {
    const count = counts.get(segment) ?? 0
    if (count > bestCount) {
      best = segment
      bestCount = count
    }
  }
  return best !== '' ? best : product.handle.trim().toUpperCase().slice(0, 32)
}
