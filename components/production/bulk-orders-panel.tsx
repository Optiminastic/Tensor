'use client'

import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition, type JSX } from 'react'

import {
  createBulkOrderAction,
  updateBulkOrderAction,
} from '@/app/dashboard/[brand]/production/bulk-orders/actions'
import { BulkOrderForm } from '@/components/production/bulk-order-form'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import { inr } from '@/lib/format'
import type {
  BulkOrder,
  BulkOrderInput,
  BulkOrderStatus,
  SellableSku,
} from '@/lib/validators/bulk-orders'

const STATUS_TONE: Record<BulkOrderStatus, 'accent' | 'success' | 'warning' | 'danger'> = {
  draft: 'warning',
  sent: 'accent',
  accepted: 'success',
  cancelled: 'danger',
}

interface BulkOrdersPanelProps {
  brand: string
  orders: BulkOrder[]
  skus: SellableSku[]
  loadError: string | null
  skuError: string | null
}

/**
 * The Bulk Orders screen: the list, and the dialog that creates or edits one.
 *
 * Editing opens the same form as creating, deliberately. A quotation is one
 * shape whether it is being written or revised, and the thing that differs -
 * that saving re-prices and re-issues the document - belongs in the backend,
 * not in a second form that can drift from the first.
 */
export function BulkOrdersPanel({
  brand,
  orders,
  skus,
  loadError,
  skuError,
}: BulkOrdersPanelProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<BulkOrder | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function openCreate(): void {
    setEditing(null)
    setError(null)
    setOpen(true)
  }

  function openEdit(order: BulkOrder): void {
    setEditing(order)
    setError(null)
    setOpen(true)
  }

  function save(input: BulkOrderInput): void {
    setError(null)
    startTransition(async () => {
      const result = editing
        ? await updateBulkOrderAction(brand, editing.id, input)
        : await createBulkOrderAction(brand, input)
      if (!result.ok) {
        setError(result.error ?? 'Could not save the bulk order.')
        return
      }
      setOpen(false)
      setEditing(null)
    })
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-display text-4xl">Bulk Orders</h1>
          <p className="text-muted-foreground max-w-prose text-sm text-pretty">
            Quotations for businesses ordering at volume. Prices come from this brand&apos;s Shopify
            and are fixed into the quotation when you save it.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" aria-hidden /> Add Bulk Order
        </Button>
      </div>

      {loadError ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-4 py-3 text-sm">
          {loadError}
        </p>
      ) : null}
      {skuError ? (
        <p role="alert" className="bg-warning-subtle text-warning rounded-md px-4 py-3 text-sm">
          {skuError} Existing quotations still open; new ones need the price list.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Quotations</CardTitle>
          <CardDescription>
            {orders.length === 0
              ? 'None yet. Add a bulk order to raise the first one.'
              : `${orders.length} quotation${orders.length === 1 ? '' : 's'}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? null : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Quotation</TableHeaderCell>
                  <TableHeaderCell>Customer</TableHeaderCell>
                  <TableHeaderCell>Date</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell className="text-right">Total</TableHeaderCell>
                  <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.quotation_number}</TableCell>
                    <TableCell className="text-sm">{order.customer_name}</TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">
                      {order.order_date}
                    </TableCell>
                    <TableCell>
                      <Badge tone={STATUS_TONE[order.status]}>{order.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums">
                      {inr(order.total, 2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(order)}>
                          Edit
                        </Button>
                        <Link
                          href={`/dashboard/${brand}/production/bulk-orders/${order.id}`}
                          className={buttonVariants({ variant: 'secondary', size: 'sm' })}
                        >
                          Quotation
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${editing.quotation_number}` : 'Add bulk order'}
            </DialogTitle>
          </DialogHeader>
          {/* Keyed so switching between create and edit re-mounts the form with
              the right starting values instead of keeping the previous ones. */}
          <BulkOrderForm
            key={editing?.id ?? 'new'}
            skus={skus}
            existing={editing ?? undefined}
            submitting={pending}
            error={error}
            onSubmit={save}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </main>
  )
}
