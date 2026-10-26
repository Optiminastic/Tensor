'use client'

import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { type JSX, useEffect, useState } from 'react'

import { loadDamageReportAction } from '@/app/dashboard/[brand]/agent/damaged-products/actions'
import { DamageFileGrid } from '@/components/agent/damage-file-grid'
import { DamageResolutionControl } from '@/components/agent/damage-resolution-control'
import { DAMAGE_STATUS_CONFIG } from '@/components/agent/damage-status-config'
import { DamageTimeline } from '@/components/agent/damage-timeline'
import { displayNumber, messageTime } from '@/components/agent/whatsapp-time'
import { OrderDetailView } from '@/components/production/order-detail-view'
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
import type { DamageReport, DamageReportDetail } from '@/lib/validators/whatsapp-damage'
import { type OrderDrawerDetail, fetchOrderDetail } from '@/services/order-drawer.service'

interface DamageDetailSheetProps {
  brand: string
  /** Kept while the drawer closes, so it slides out whole. */
  report: DamageReport | null
  open: boolean
  canResolve: boolean
  onClose: () => void
  onChanged: () => void
}

/**
 * One damage report: the photographs, the order and where anyone has got to
 * with it.
 *
 * DAMAGE ONLY. There is deliberately no view of the wider conversation here -
 * the menu taps, the delivery questions, the small talk. This screen answers
 * "what broke, what did they send us, and what did we do about it", and
 * anything else on the thread is somebody else's business.
 *
 * Nothing is fetched until it opens, so a list of fifty reports does not pull
 * fifty sets of photographs nobody looks at.
 */
export function DamageDetailSheet({
  brand,
  report,
  open,
  canResolve,
  onClose,
  onChanged,
}: DamageDetailSheetProps): JSX.Element {
  return (
    <Sheet open={open} onOpenChange={next => !next && onClose()}>
      <SheetContent side="right" className="flex w-full max-w-2xl flex-col">
        {report ? (
          // Keyed on the report, so the tab and everything fetched start fresh
          // for each one rather than leaking from the last.
          <DrawerContents
            key={report.id}
            brand={brand}
            report={report}
            canResolve={canResolve}
            onChanged={onChanged}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

type View = 'photos' | 'order'

interface DrawerContentsProps {
  brand: string
  report: DamageReport
  canResolve: boolean
  onChanged: () => void
}

function DrawerContents({
  brand,
  report,
  canResolve,
  onChanged,
}: DrawerContentsProps): JSX.Element {
  const [view, setView] = useState<View>('photos')
  // Bumped by anything that acts on the report, to re-read the timeline.
  //
  // The list behind this drawer refreshes itself and hands down a new report,
  // which is enough for the badges - but the stages are fetched HERE and keyed
  // on the report id, so without this a confirmed payment left the progress
  // list showing the step it had just completed as still to come.
  const [reloads, setReloads] = useState(0)
  const detail = useDamageDetail(brand, report.id, reloads)
  const status = DAMAGE_STATUS_CONFIG[report.status]

  function changed(): void {
    setReloads(n => n + 1)
    onChanged()
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono">{report.order_number}</span>
          <TonePill label={status.label} tone={status.tone} />
        </SheetTitle>
        <SheetDescription asChild>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span>
              {report.customer_name || 'Customer'} · {displayNumber(report.wa_id)}
            </span>
            <span>Reported {messageTime(report.reported_at)}</span>
            {report.order_id ? (
              <Link
                href={`/dashboard/${brand}/production/orders/${report.order_id}`}
                prefetch={false}
                className="text-accent inline-flex items-center gap-1 underline-offset-4 hover:underline"
              >
                Open the order
                <ExternalLink className="size-3" aria-hidden />
              </Link>
            ) : null}
          </div>
        </SheetDescription>
      </SheetHeader>

      <div className="px-6 pb-3">
        <Tabs
          tabs={[
            { value: 'photos', label: 'Photos' },
            { value: 'order', label: 'Order' },
          ]}
          value={view}
          onValueChange={value => setView(value as View)}
          label="Damage report view"
        />
      </div>

      <SheetBody className="flex-1" role="tabpanel">
        {view === 'photos' ? (
          <div className="flex flex-col gap-6">
            {detail.error ? (
              <Failed what="this report's photos" />
            ) : !detail.data ? (
              <Loading />
            ) : (
              <DamageFileGrid brand={brand} reportId={report.id} files={detail.data.files} />
            )}
            {/* WHAT we are doing about it, and HOW FAR ALONG the report is,
                are two questions. They were one dropdown labelled
                "Resolution" that in fact set the status, which is why a
                decided report still read as undecided. */}
            <DamageResolutionControl
              brand={brand}
              report={report}
              canResolve={canResolve}
              stages={detail.data?.stages ?? []}
              paymentProof={detail.data?.payment_proof ?? null}
              onChanged={changed}
            />
            {/* Below the control, because it is the record of what the
                control did - and what it has not managed yet. */}
            {detail.data ? <DamageTimeline stages={detail.data.stages} /> : null}
          </div>
        ) : (
          <OrderTab brand={brand} report={report} />
        )}
      </SheetBody>
    </>
  )
}

/**
 * The order the customer named, in full.
 *
 * THE WHOLE ORDER, not a link to it. Somebody working a damage report is
 * deciding whether to reprint or refund, and that needs what was bought,
 * which names were engraved, what it cost and where it went - all of which
 * already exist on the order drawer. Reusing OrderDetailView means this tab
 * cannot drift from the orders page, and a link alone would have made the
 * reader leave the report to find out.
 *
 * Fetched only when this tab is opened, so a list of reports does not pull
 * an order for each one.
 */
function OrderTab({ brand, report }: { brand: string; report: DamageReport }): JSX.Element {
  const detail = useOrderDetail(report.order_id)

  if (!report.order_id) {
    return (
      <p className="text-muted-foreground text-sm text-pretty">
        No order in Tensor matches <span className="font-mono">{report.order_number}</span> — the
        customer typed it into the damage form themselves, so it may be mistyped, or from a sync
        that has not caught up yet.
      </p>
    )
  }
  if (detail.error) {
    return (
      <div className="flex flex-col gap-3 text-sm">
        {/* The backend gates orders on order:read and this page on
            whatsapp:read, so a reader can legitimately hold one and not the
            other. Saying so beats a bare "could not load". */}
        <p className="text-muted-foreground text-pretty">
          Could not load order <span className="font-mono">{report.order_number}</span>. You may not
          have permission to see orders.
        </p>
        <Link
          href={`/dashboard/${brand}/production/orders/${report.order_id}`}
          prefetch={false}
          className="text-accent inline-flex items-center gap-1 underline-offset-4 hover:underline"
        >
          Open the full order
          <ExternalLink className="size-3" aria-hidden />
        </Link>
      </div>
    )
  }
  if (!detail.data) {
    return <Loading />
  }
  return <OrderDetailView brand={brand} order={detail.data.order} jobs={detail.data.jobs} />
}

/** One order and its jobs, asked for when the Order tab is opened. */
function useOrderDetail(orderId: string | null): {
  data: OrderDrawerDetail | null
  error: boolean
} {
  const [data, setData] = useState<OrderDrawerDetail | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!orderId) return
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

/**
 * The report, its photographs and its timeline, asked for as the drawer opens
 * and again whenever `reloads` changes.
 */
function useDamageDetail(
  brand: string,
  id: string,
  reloads: number,
): { data: DamageReportDetail | null; error: boolean } {
  const [data, setData] = useState<DamageReportDetail | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError(false)
    loadDamageReportAction({ brand, id })
      .then(result => {
        if (cancelled) return
        if (result.ok && result.data) setData(result.data)
        else setError(true)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [brand, id, reloads])

  return { data, error }
}
