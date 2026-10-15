'use client'

import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { type JSX, useEffect, useState } from 'react'

import { OrderDetailAside } from '@/components/production/order-detail-aside'
import { OrderFulfillmentCard } from '@/components/production/order-fulfillment-card'
import { OrderJobRetry } from '@/components/production/order-job-retry'
import { OrderPaymentCard } from '@/components/production/order-payment-card'
import { OrderPersonalisationLog } from '@/components/production/order-personalisation-log'
import { OrderPersonalisationPanel } from '@/components/production/order-personalisation-panel'
import { ORDER_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs } from '@/components/ui/tabs'
import { dateTime } from '@/lib/format'
import type { OrderPersonalisation } from '@/lib/validators/order-personalisation'
import {
  fetchOrderDetail,
  fetchOrderPersonalisation,
  type OrderDrawerDetail,
} from '@/services/order-drawer.service'

interface OrderDetailSheetProps {
  brand: string
  /** The order to show, or null when the drawer is closed. */
  orderId: string | null
  /** The number, known from the row, so the header reads right before the fetch lands. */
  orderNumber: string
  onClose: () => void
}

/**
 * An order, over the table rather than instead of it.
 *
 * A page meant losing your place: the orders list is filtered, searched and
 * paged, and coming back from an order threw all of that away. The drawer
 * keeps the table underneath.
 *
 * NOTHING IS FETCHED UNTIL IT OPENS. The table shows fifty orders and carries
 * only what a row needs; the detail - line items, addresses, jobs - is asked
 * for when somebody actually opens one. Fetching all fifty up front would be
 * fifty round trips for forty-nine answers nobody reads.
 */
export function OrderDetailSheet({
  brand,
  orderId,
  orderNumber,
  onClose,
}: OrderDetailSheetProps): JSX.Element {
  return (
    <Sheet open={orderId !== null} onOpenChange={next => !next && onClose()}>
      <SheetContent side="right" className="flex w-full max-w-2xl flex-col">
        {orderId ? (
          // Keyed on the order, so the tab and everything fetched start fresh
          // for each one rather than leaking from the last.
          <DrawerContents key={orderId} brand={brand} orderId={orderId} orderNumber={orderNumber} />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

type View = 'overview' | 'personalisation'

interface DrawerContentsProps {
  brand: string
  orderId: string
  orderNumber: string
}

function DrawerContents({ brand, orderId, orderNumber }: DrawerContentsProps): JSX.Element {
  const [view, setView] = useState<View>('overview')
  const detail = useOrderDetail(orderId)
  const personalisation = usePersonalisation(orderId, view === 'personalisation')

  const order = detail.data?.order
  const status = order ? ORDER_STATUS_CONFIG[order.status] : null

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono">{order?.orderNumber ?? orderNumber}</span>
          {status ? <TonePill label={status.label} tone={status.tone} /> : null}
        </SheetTitle>
        <SheetDescription asChild>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {order ? (
              <span>
                {order.placedAt ? 'Placed' : 'Imported'}{' '}
                {dateTime(order.placedAt ?? order.submittedAt)}
              </span>
            ) : (
              <span>Loading…</span>
            )}
            {/* The full page is still there, for a link somebody wants to send
                to a colleague. The drawer is the convenience, not a
                replacement for an address. */}
            <Link
              href={`/dashboard/${brand}/production/orders/${orderId}`}
              prefetch={false}
              className="text-accent inline-flex items-center gap-1 underline-offset-4 hover:underline"
            >
              Open full page
              <ExternalLink className="size-3" aria-hidden />
            </Link>
          </div>
        </SheetDescription>
      </SheetHeader>

      <div className="px-6 pb-3">
        <Tabs
          tabs={[
            { value: 'overview', label: 'Overview' },
            { value: 'personalisation', label: 'Personalisation' },
          ]}
          value={view}
          onValueChange={value => setView(value as View)}
          label="Order detail view"
        />
      </div>

      <SheetBody className="flex-1" role="tabpanel">
        {view === 'overview' ? (
          detail.error ? (
            <Failed what="this order" />
          ) : !detail.data ? (
            <Loading />
          ) : (
            <div className="flex flex-col gap-4">
              <OrderJobRetry
                brand={brand}
                orderId={orderId}
                jobCreationError={detail.data.order.jobCreationError}
              />
              <OrderFulfillmentCard order={detail.data.order} />
              <OrderPaymentCard order={detail.data.order} />
              <OrderDetailAside order={detail.data.order} />
              <OrderPersonalisationLog brand={brand} jobs={detail.data.jobs} />
            </div>
          )
        ) : personalisation.error ? (
          <Failed what="what this customer was asked" />
        ) : !personalisation.data ? (
          <Loading />
        ) : (
          <OrderPersonalisationPanel data={personalisation.data} />
        )}
      </SheetBody>
    </>
  )
}

function Loading(): JSX.Element {
  return <p className="text-muted-foreground py-8 text-center text-sm">Loading…</p>
}

function Failed({ what }: { what: string }): JSX.Element {
  return (
    <p role="alert" className="text-danger py-8 text-center text-sm text-pretty">
      Could not load {what}. Close this and try again.
    </p>
  )
}

/** One order and its jobs, asked for as the drawer opens. */
function useOrderDetail(orderId: string): { data: OrderDrawerDetail | null; error: boolean } {
  const [data, setData] = useState<OrderDrawerDetail | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError(false)
    fetchOrderDetail(orderId)
      .then(result => {
        if (!cancelled) setData(result)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [orderId])

  return { data, error }
}

/**
 * The personalisation half, asked for only when that tab is opened.
 *
 * Its own request because rebuilding the message means a round trip to Meta,
 * and nobody reading the Overview should wait for one. Fetched once per
 * order: `data !== null` is the guard, so switching tabs back and forth does
 * not re-ask.
 */
function usePersonalisation(
  orderId: string,
  wanted: boolean,
): { data: OrderPersonalisation | null; error: boolean } {
  const [data, setData] = useState<OrderPersonalisation | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!wanted || data !== null) return
    let cancelled = false
    setError(false)
    fetchOrderPersonalisation(orderId)
      .then(result => {
        if (!cancelled) setData(result)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [wanted, orderId, data])

  return { data, error }
}
