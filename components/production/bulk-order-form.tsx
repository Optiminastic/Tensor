'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, type JSX } from 'react'

import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { inr } from '@/lib/format'
import {
  BULK_ORDER_STATUSES,
  type BulkOrder,
  type BulkOrderInput,
  type BulkOrderStatus,
  type SellableSku,
} from '@/lib/validators/bulk-orders'

/** One editable row: which SKU, and how many. */
interface LineDraft {
  key: string
  sku: string
  quantity: string
}

interface BulkOrderFormProps {
  skus: SellableSku[]
  /** Present when editing; absent when creating. */
  existing?: BulkOrder
  submitting: boolean
  error: string | null
  onSubmit: (input: BulkOrderInput) => void
  onCancel: () => void
}

function newLine(): LineDraft {
  // crypto.randomUUID keeps React keys stable across reorders; an index key
  // would make deleting the first row re-mount every row below it and lose
  // whatever was half-typed in them.
  return { key: crypto.randomUUID(), sku: '', quantity: '1' }
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * The Add / Edit bulk order form.
 *
 * It shows a running total, and that total is ADVISORY. Tensor-Core recomputes
 * every figure from the SKUs and quantities it is sent, because this form runs
 * in a browser and its arithmetic is a convenience for the operator, not the
 * number the customer is held to. When the two disagree the backend wins, and
 * the saved quotation is what it says.
 */
export function BulkOrderForm({
  skus,
  existing,
  submitting,
  error,
  onSubmit,
  onCancel,
}: BulkOrderFormProps): JSX.Element {
  const [customerName, setCustomerName] = useState(existing?.customer_name ?? '')
  const [customerEmail, setCustomerEmail] = useState(existing?.customer_email ?? '')
  const [customerPhone, setCustomerPhone] = useState(existing?.customer_phone ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [orderDate, setOrderDate] = useState(existing?.order_date ?? today())
  const [validUntil, setValidUntil] = useState(existing?.valid_until ?? '')
  const [status, setStatus] = useState<BulkOrderStatus>(existing?.status ?? 'draft')
  const [discount, setDiscount] = useState(String(existing?.discount_percent ?? 0))
  const [lines, setLines] = useState<LineDraft[]>(() =>
    existing && existing.lines.length > 0
      ? existing.lines.map(l => ({
          key: crypto.randomUUID(),
          sku: l.sku,
          quantity: String(l.quantity),
        }))
      : [newLine()],
  )

  // Grouped by product so the list reads as 124 products rather than 507 loose
  // SKUs. Built once: rebuilding it per row would redo the grouping for every
  // line on every keystroke.
  const grouped = useMemo(() => {
    const groups = new Map<string, SellableSku[]>()
    for (const s of skus) {
      const key = s.group || s.product_name
      const existing = groups.get(key)
      if (existing) existing.push(s)
      else groups.set(key, [s])
    }
    return [...groups.entries()]
  }, [skus])

  const priceBySku = useMemo(() => {
    const map = new Map<string, number | null>()
    for (const s of skus) map.set(s.sku, s.unit_price)
    return map
  }, [skus])

  const totals = useMemo(() => {
    let subtotal = 0
    for (const line of lines) {
      const price = priceBySku.get(line.sku)
      const qty = Number(line.quantity)
      if (typeof price !== 'number' || !Number.isFinite(qty) || qty <= 0) continue
      subtotal += price * qty
    }
    const percent = Math.min(Math.max(Number(discount) || 0, 0), 100)
    const off = (subtotal * percent) / 100
    return { subtotal, off, total: subtotal - off }
  }, [lines, discount, priceBySku])

  const unpriced = lines.filter(l => l.sku !== '' && typeof priceBySku.get(l.sku) !== 'number')

  function setLine(key: string, patch: Partial<LineDraft>): void {
    setLines(current => current.map(l => (l.key === key ? { ...l, ...patch } : l)))
  }

  function submit(): void {
    onSubmit({
      customer_name: customerName.trim(),
      customer_email: customerEmail.trim(),
      customer_phone: customerPhone.trim(),
      notes: notes.trim(),
      order_date: orderDate,
      valid_until: validUntil,
      status,
      discount_percent: Number(discount) || 0,
      lines: lines
        .filter(l => l.sku !== '')
        .map(l => ({ sku: l.sku, quantity: Number(l.quantity) || 0 })),
    })
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={event => {
        event.preventDefault()
        submit()
      }}
    >
      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business or customer" htmlFor="bo-customer" required>
          <Input
            id="bo-customer"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            placeholder="Acme Gifting Pvt Ltd"
            required
          />
        </Field>
        <Field label="Email" htmlFor="bo-email">
          <Input
            id="bo-email"
            type="email"
            value={customerEmail}
            onChange={e => setCustomerEmail(e.target.value)}
          />
        </Field>
        <Field label="Phone" htmlFor="bo-phone">
          <Input
            id="bo-phone"
            value={customerPhone}
            onChange={e => setCustomerPhone(e.target.value)}
          />
        </Field>
        <Field label="Status" htmlFor="bo-status">
          <Select
            id="bo-status"
            value={status}
            onChange={e => setStatus(e.target.value as BulkOrderStatus)}
          >
            {BULK_ORDER_STATUSES.map(s => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Order date" htmlFor="bo-date" required>
          <Input
            id="bo-date"
            type="date"
            value={orderDate}
            onChange={e => setOrderDate(e.target.value)}
            required
          />
        </Field>
        <Field label="Quotation valid until" htmlFor="bo-valid" hint="Optional">
          <Input
            id="bo-valid"
            type="date"
            value={validUntil}
            onChange={e => setValidUntil(e.target.value)}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Products</span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setLines(current => [...current, newLine()])}
          >
            <Plus className="size-3.5" aria-hidden /> Add product
          </Button>
        </div>

        {lines.map(line => {
          const price = priceBySku.get(line.sku)
          const qty = Number(line.quantity) || 0
          return (
            <div key={line.key} className="flex items-end gap-2">
              <Field label="SKU" htmlFor={`sku-${line.key}`} className="flex-1">
                <Select
                  id={`sku-${line.key}`}
                  value={line.sku}
                  onChange={e => setLine(line.key, { sku: e.target.value })}
                >
                  <option value="">Choose a product…</option>
                  {grouped.map(([group, options]) => (
                    <optgroup key={group} label={group}>
                      {options.map(s => (
                        <option key={s.sku} value={s.sku}>
                          {s.sku} — {s.product_name}
                          {s.unit_price === null ? ' (no price)' : ` (${inr(s.unit_price)})`}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
              </Field>
              <Field label="Qty" htmlFor={`qty-${line.key}`} className="w-24">
                <Input
                  id={`qty-${line.key}`}
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={e => setLine(line.key, { quantity: e.target.value })}
                />
              </Field>
              <div className="w-28 pb-2 text-right font-mono text-sm tabular-nums">
                {typeof price === 'number' ? inr(price * qty) : '—'}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mb-1"
                aria-label="Remove this product"
                onClick={() =>
                  setLines(current =>
                    current.length === 1 ? [newLine()] : current.filter(l => l.key !== line.key),
                  )
                }
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>
          )
        })}

        {unpriced.length > 0 ? (
          <p role="alert" className="bg-warning-subtle text-warning rounded-md px-3 py-2 text-sm">
            {unpriced.map(l => l.sku).join(', ')} has no price in Shopify, so this quotation cannot
            be saved until it does or the line is removed.
          </p>
        ) : null}
      </div>

      <div className="border-border flex flex-col gap-2 border-t pt-4">
        <div className="flex items-center justify-between gap-4">
          <Field label="Discount %" htmlFor="bo-discount" className="w-32">
            <Input
              id="bo-discount"
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={discount}
              onChange={e => setDiscount(e.target.value)}
            />
          </Field>
          <dl className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between gap-8">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-mono tabular-nums">{inr(totals.subtotal, 2)}</dd>
            </div>
            <div className="flex justify-between gap-8">
              <dt className="text-muted-foreground">Discount</dt>
              <dd className="text-danger font-mono tabular-nums">−{inr(totals.off, 2)}</dd>
            </div>
            <div className="border-border flex justify-between gap-8 border-t pt-1 font-medium">
              <dt>Total</dt>
              <dd className="font-mono tabular-nums">{inr(totals.total, 2)}</dd>
            </div>
          </dl>
        </div>
        <p className="text-subtle-foreground text-xs">
          Tensor-Core recalculates these from the products and quantities when you save; the
          quotation shows whatever it works out.
        </p>
      </div>

      <Field label="Notes" htmlFor="bo-notes" hint="Shown on the quotation">
        <Textarea id="bo-notes" rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
      </Field>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || unpriced.length > 0}>
          {submitting ? 'Saving…' : existing ? 'Save changes' : 'Create bulk order'}
        </Button>
      </div>
    </form>
  )
}
