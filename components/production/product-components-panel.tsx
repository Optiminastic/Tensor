'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState, type JSX } from 'react'

import {
  loadProductBom,
  saveProductBomAction,
} from '@/app/dashboard/[brand]/production/component-actions'
import { ComponentFilesPanel } from '@/components/production/component-files-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Tag } from '@/components/ui/tag'
import type { InventoryItem } from '@/lib/validators/inventory'
import type { BomLine, RegistryVariant } from '@/lib/validators/registry'

interface ProductComponentsPanelProps {
  brand: string
  productCode: string
  /** The shelf, for the picker. */
  components: InventoryItem[]
  /** This product's SKUs, which are the rows of a per-SKU file grid. */
  variants: RegistryVariant[]
}

interface DraftLine {
  itemId: string
  quantity: string
}

/**
 * What a product is made of, besides the thing Tensor prints for the customer.
 *
 * The diya holder that attaches to the Royal, the red heart on a plank, the
 * box a lit plank sits in: printed separately or bought in, and none of them
 * carrying anybody's name. They are listed here rather than as design files
 * because a design file becomes a production job per order, and these do not -
 * they are made to stock and attached at the bench.
 *
 * The list belongs to the PRODUCT and every SKU inherits it. A SKU that needs
 * something different declares its own, which replaces this list rather than
 * adding to it.
 */
export function ProductComponentsPanel({
  brand,
  productCode,
  components,
  variants,
}: ProductComponentsPanelProps): JSX.Element {
  const [lines, setLines] = useState<DraftLine[] | null>(null)
  const [saved, setSaved] = useState<BomLine[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let live = true
    void loadProductBom(productCode).then(res => {
      if (!live) return
      if (!res.ok || !res.data) {
        setError(res.error ?? 'Could not load the components.')
        setLines([])
        return
      }
      setSaved(res.data)
      setLines(res.data.map(l => ({ itemId: l.item_id, quantity: String(l.quantity) })))
    })
    return () => {
      live = false
    }
  }, [productCode])

  function update(index: number, patch: Partial<DraftLine>): void {
    setDone(false)
    setLines(current => (current ?? []).map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }

  async function save(): Promise<void> {
    const draft = lines ?? []
    const cleaned = draft
      .map(l => ({ item_id: l.itemId, quantity: Number(l.quantity) }))
      .filter(l => l.item_id !== '')
    if (cleaned.some(l => !Number.isFinite(l.quantity) || l.quantity <= 0)) {
      setError('Every component needs a quantity above zero.')
      return
    }
    if (new Set(cleaned.map(l => l.item_id)).size !== cleaned.length) {
      setError('The same part is listed twice. Give it one line and the total quantity.')
      return
    }
    setBusy(true)
    setError(null)
    const res = await saveProductBomAction({ brand, code: productCode }, cleaned)
    setBusy(false)
    if (!res.ok || !res.data) {
      setError(res.error ?? 'Could not save the components.')
      return
    }
    setSaved(res.data)
    setLines(res.data.map(l => ({ itemId: l.item_id, quantity: String(l.quantity) })))
    setDone(true)
  }

  if (lines === null) {
    return <p className="text-muted-foreground text-sm">Loading…</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        What this product is made of besides the part Tensor prints for the customer. Every SKU
        inherits this list; one that needs something different declares its own, which replaces this
        rather than adding to it.
      </p>

      {lines.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nothing listed. Add the pieces that are printed to stock or bought in — the holder, the
          heart, the box.
        </p>
      ) : (
        <ul className="divide-border/70 divide-y">
          {lines.map((line, i) => {
            const item = components.find(c => c.id === line.itemId)
            return (
              <li key={i} className="flex flex-wrap items-center gap-2 py-2">
                <Select
                  value={line.itemId}
                  disabled={busy}
                  aria-label="Component"
                  className="w-64"
                  onChange={e => update(i, { itemId: e.target.value })}
                >
                  <option value="">Choose a part…</option>
                  {/* Named with the product it was created for, so linking a
                      Royal's cup to the Lotus is visibly odd rather than
                      invisible. The list stays complete, because a genuinely
                      shared part - packaging, a gift box - belongs on several. */}
                  {components.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.code ? `${c.code} · ${c.name}` : c.name}
                      {c.shopify_product_title ? ` — for ${c.shopify_product_title}` : ''}
                    </option>
                  ))}
                </Select>
                <Input
                  value={line.quantity}
                  disabled={busy}
                  inputMode="decimal"
                  aria-label="Quantity"
                  className="w-24 font-mono tabular-nums"
                  onChange={e => update(i, { quantity: e.target.value })}
                />
                <span className="text-subtle-foreground text-xs">{item?.unit ?? ''}</span>
                {item?.source === 'printed' ? <Tag tone="accent">Printed here</Tag> : null}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  aria-label="Remove this component"
                  onClick={() => {
                    setDone(false)
                    setLines(current => (current ?? []).filter((_, j) => j !== i))
                  }}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => {
            setDone(false)
            setLines(current => [...(current ?? []), { itemId: '', quantity: '1' }])
          }}
        >
          <Plus className="size-4" aria-hidden />
          Add a component
        </Button>
        <Button size="sm" disabled={busy} onClick={() => void save()}>
          Save components
        </Button>
        {done ? (
          <span role="status" className="text-success text-sm">
            Saved {saved.length} component{saved.length === 1 ? '' : 's'}.
          </span>
        ) : null}
      </div>

      {/* Said plainly, because a count on this screen looks like an inventory
          system and is not one: nothing takes a part off the shelf when a job
          is assembled. */}
      <p className="text-subtle-foreground text-xs">
        Stock counts are kept by hand on the Components tab — nothing is deducted automatically when
        a job is assembled.
      </p>

      {/* The files, below the list that decides which parts there are.
          Driven by SAVED lines rather than the draft: a part being typed into
          the picker has nothing to upload against yet, and a grid appearing
          under a half-chosen row reads as a file that is already attached. */}
      <div className="border-border/70 flex flex-col gap-3 border-t pt-4">
        <h3 className="text-sm font-medium">Part files</h3>
        <ComponentFilesPanel
          brand={brand}
          parts={saved.flatMap(line => {
            const item = components.find(c => c.id === line.item_id)
            return item ? [item] : []
          })}
          variants={variants}
          disabled={busy}
        />
      </div>

      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  )
}
