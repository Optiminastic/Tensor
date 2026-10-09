'use client'

import { ExternalLink, Package, Phone } from 'lucide-react'
import { type JSX, type ReactNode, useState } from 'react'

import { day, reasonTone, when } from '@/components/shipping/shipment-reason'
import { Badge } from '@/components/ui/badge'
import { CopyableId } from '@/components/ui/copyable-id'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs } from '@/components/ui/tabs'
import type { Shipment } from '@/lib/validators/shipments'

interface ShipmentDetailSheetProps {
  /** The parcel to show, or null when the panel is closed. */
  shipment: Shipment | null
  onClose: () => void
}

type View = 'trail' | 'overview'

/**
 * One parcel, in full: where it is, what the courier said, and who to call.
 *
 * A PANEL, not an expanding row. The scan trail runs to twenty events on a
 * parcel that has been anywhere, and opening that inside the table pushes every
 * other row off the screen - so you lose the list to look at one item in it.
 *
 * The trail is the default view rather than the summary. The summary is already
 * in the row that was clicked; what is not on the row is the history that
 * explains it, and on a failed delivery that history is the argument somebody
 * takes to the courier.
 */
export function ShipmentDetailSheet({ shipment, onClose }: ShipmentDetailSheetProps): JSX.Element {
  const [view, setView] = useState<View>('trail')
  const scans = shipment?.scans ?? []

  return (
    <Sheet open={shipment !== null} onOpenChange={open => !open && onClose()}>
      <SheetContent side="right" className="flex max-w-2xl flex-col">
        <SheetHeader>
          <SheetTitle>{shipment?.order_name || 'Shipment'}</SheetTitle>
          <SheetDescription asChild>
            <div className="flex flex-wrap items-center gap-2">
              {shipment ? (
                <>
                  <Badge tone={reasonTone(shipment.reason)}>{shipment.reason_label}</Badge>
                  {shipment.returning ? <Badge tone="danger">Returning to origin</Badge> : null}
                  <CopyableId value={shipment.waybill} label="waybill" />
                </>
              ) : null}
            </div>
          </SheetDescription>
        </SheetHeader>

        {shipment ? (
          <>
            <div className="border-border flex shrink-0 flex-col gap-4 border-b px-6 py-4">
              {/* Delhivery's own sentence, at the top and unabbreviated. Every
                  classification on this page is derived from this line, so it
                  is the one thing that must never be paraphrased away. */}
              <p className="bg-surface-muted rounded-md px-3 py-2 text-sm text-pretty">
                {shipment.instruction || 'The carrier has not said why.'}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                {shipment.phone ? (
                  <a
                    href={`tel:${shipment.phone}`}
                    className="border-border text-foreground hover:bg-surface-muted inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors"
                  >
                    <Phone className="size-3.5" aria-hidden />
                    <span className="font-mono">{shipment.phone}</span>
                  </a>
                ) : null}
                {shipment.tracking_url ? (
                  <a
                    href={shipment.tracking_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="border-border text-foreground hover:bg-surface-muted inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors"
                  >
                    <Package className="size-3.5" aria-hidden />
                    Carrier tracking
                    <ExternalLink className="size-3" aria-hidden />
                  </a>
                ) : null}
                {shipment.admin_url ? (
                  <a
                    href={shipment.admin_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="border-border text-foreground hover:bg-surface-muted inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors"
                  >
                    Order in Shopify
                    <ExternalLink className="size-3" aria-hidden />
                  </a>
                ) : null}
              </div>

              <Tabs
                tabs={[
                  { value: 'trail', label: 'Carrier trail', count: scans.length },
                  { value: 'overview', label: 'Details' },
                ]}
                value={view}
                onValueChange={next => setView(next as View)}
                label="Shipment detail view"
              />
            </div>

            <SheetBody
              className="flex-1"
              role="tabpanel"
              id={`panel-${view}`}
              aria-labelledby={`tab-${view}`}
            >
              {view === 'trail' ? (
                <ScanTrail shipment={shipment} />
              ) : (
                <Overview shipment={shipment} />
              )}
            </SheetBody>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

/**
 * The carrier's events, newest first.
 *
 * Newest first here, oldest first in the list behind it - and that inversion is
 * deliberate. On the list you are hunting for the parcel that has been stuck
 * longest; inside one parcel you want to know what just happened to it.
 */
function ScanTrail({ shipment }: { shipment: Shipment }): JSX.Element {
  if (shipment.scans.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border border-dashed px-4 py-8 text-center text-sm">
        {shipment.tracked
          ? 'The carrier has recorded no scans for this waybill.'
          : 'Delhivery does not recognise this waybill, so there is no trail to read.'}
      </p>
    )
  }

  return (
    <ol className="flex flex-col">
      {shipment.scans.map((scan, index) => (
        <li
          key={`${scan.at}-${scan.status_code}-${index}`}
          className="border-border/70 flex gap-3 border-b py-2.5 last:border-b-0"
        >
          <span className="flex w-14 shrink-0 flex-col items-end">
            <span className="text-muted-foreground font-mono text-[0.6875rem] tabular-nums">
              {day(scan.at)}
            </span>
            <span className="text-subtle-foreground font-mono text-[0.6875rem] tabular-nums">
              {clock(scan.at)}
            </span>
          </span>
          {/* Filled on the newest event only: it is the one that is still true. */}
          <span
            aria-hidden
            className={
              index === 0
                ? 'bg-foreground mt-1.5 size-1.5 shrink-0 rounded-full'
                : 'border-border mt-1.5 size-1.5 shrink-0 rounded-full border'
            }
          />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-foreground text-sm">{scan.instruction || scan.status}</span>
            <span className="text-muted-foreground text-xs">
              {[scan.status, scan.location].filter(Boolean).join(' · ')}
            </span>
          </span>
        </li>
      ))}
    </ol>
  )
}

function clock(raw: string): string {
  if (!raw) return ''
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function Row({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <div className="border-border/70 flex gap-4 border-b py-2 last:border-b-0">
      <dt className="text-muted-foreground w-40 shrink-0 text-xs">{label}</dt>
      <dd className="min-w-0 flex-1 text-sm break-words">{children}</dd>
    </div>
  )
}

function Overview({ shipment }: { shipment: Shipment }): JSX.Element {
  const symbol = shipment.currency === 'INR' ? '₹' : `${shipment.currency} `
  const value = shipment.total_amount ? `${symbol}${shipment.total_amount}` : '—'

  return (
    <dl className="flex flex-col">
      <Row label="Carrier">{shipment.carrier || '—'}</Row>
      <Row label="Carrier status">
        {[shipment.status, shipment.status_type].filter(Boolean).join(' / ') || '—'}
        {shipment.status_code ? (
          <span className="text-subtle-foreground ml-2 font-mono text-xs">
            {shipment.status_code}
          </span>
        ) : null}
      </Row>
      <Row label="Last scan">
        {when(shipment.status_at)}
        {shipment.location ? (
          <span className="text-muted-foreground"> · {shipment.location}</span>
        ) : null}
      </Row>
      <Row label="Delivery attempts">
        <span className="font-mono tabular-nums">{shipment.attempts}</span>
        {shipment.first_attempt_at ? (
          <span className="text-muted-foreground"> · first {when(shipment.first_attempt_at)}</span>
        ) : null}
      </Row>
      <Row label="Promised by">{day(shipment.promised_at)}</Row>
      {/* Only when the two differ: an expected date that matches the promise is
          noise, and one that has slipped past it is the whole story. */}
      {shipment.expected_at && shipment.expected_at !== shipment.promised_at ? (
        <Row label="Now expected">{day(shipment.expected_at)}</Row>
      ) : null}

      <Row label="Consignee">{shipment.customer_name || '—'}</Row>
      <Row label="Phone">
        {shipment.phone ? <span className="font-mono">{shipment.phone}</span> : '—'}
      </Row>
      <Row label="Email">{shipment.email || '—'}</Row>
      <Row label="Address">{shipment.address || '—'}</Row>
      <Row label="Destination">
        {[shipment.city, shipment.state, shipment.pincode].filter(Boolean).join(', ') || '—'}
      </Row>

      <Row label="Ordered">{when(shipment.ordered_at)}</Row>
      <Row label="Shipped">{when(shipment.shipped_at)}</Row>
      <Row label="Order value">
        <span className="font-mono tabular-nums">{value}</span>
      </Row>
      {/* Shown only when there is money to collect. A row reading "₹0" on every
          pre-paid parcel trains the eye to skip the one that is not. */}
      {shipment.cod_amount > 0 ? (
        <Row label="To collect (COD)">
          <span className="text-warning font-mono tabular-nums">
            ₹{shipment.cod_amount.toLocaleString('en-IN')}
          </span>
        </Row>
      ) : null}
      <Row label="In the parcel">
        {shipment.line_items.length === 0
          ? '—'
          : shipment.line_items.map(item => (
              <span key={`${item.sku}-${item.title}-${item.variant_title}`} className="block">
                {item.quantity}&nbsp;&times;&nbsp;{item.title}
                {item.variant_title ? (
                  <span className="text-muted-foreground"> · {item.variant_title}</span>
                ) : null}
              </span>
            ))}
      </Row>
      {/* The two systems disagree by design - Shopify hears from the carrier
          hours late - so both are shown rather than one being preferred
          silently. */}
      <Row label="Shopify last heard">{shipment.shopify_status || '—'}</Row>
    </dl>
  )
}
