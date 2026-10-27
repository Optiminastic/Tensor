'use client'

import { ExternalLink, MapPin, MessageCircle, PhoneCall } from 'lucide-react'
import { type JSX, useMemo, useState } from 'react'

import { FilterBar } from '@/components/production/filter-bar'
import { ExceptionActionBar } from '@/components/shipping/exception-action-bar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import type {
  ShipmentException,
  ShipmentExceptionsResponse,
} from '@/lib/validators/shipment-exceptions'

interface ExceptionsViewProps {
  brand: string
  data: ShipmentExceptionsResponse
  canAct: boolean
}

/**
 * Delhivery's exception queue, with Delhivery's tabs.
 *
 * THE TABS ARE THEIRS. Need Action, Auto Reattempt and Return Recommendation
 * are Delhivery's own buckets, and every row arrives already filed into one.
 * Nothing here re-derives them from a status code - that is precisely what made
 * the old page list three parcels as needing a decision while Delhivery's Need
 * Action tab was empty.
 *
 * EMPTY IS AN ANSWER. "Need Action" with no rows means Delhivery wants nothing
 * from the shop, which is good news and is said as such - not left as a blank
 * table that reads like a failure to load.
 */
export function ExceptionsView({ brand, data, canAct }: ExceptionsViewProps): JSX.Element {
  const [tabKey, setTabKey] = useState(data.tabs[0]?.key ?? '')
  const [search, setSearch] = useState('')
  // Rows acted on this session. The list is assembled live from Delhivery on
  // every read, so there is no refetch to do and no local row to update.
  const [asked, setAsked] = useState<Record<string, string>>({})

  const active = useMemo(
    () => data.tabs.find(t => t.key === tabKey) ?? data.tabs[0],
    [data.tabs, tabKey],
  )

  const rows = useMemo(() => {
    const base = active?.items ?? []
    const needle = search.trim().toLowerCase()
    if (!needle) return base
    return base.filter((e: ShipmentException) =>
      [e.waybill, e.order_name, e.customer_name, e.city, e.reason]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [active, search])

  if (!data.connected) {
    return <NotConnected />
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <FilterBar
        tabs={data.tabs.map(tab => ({
          value: tab.key,
          label: tab.label,
          count: tab.count,
          // Only the tab waiting on the shop is live. The other two are
          // Delhivery's own work and counting them loudly invites somebody to
          // "clear" a queue that is not theirs.
          countTone: tab.key === 'NEED_ACTION' && tab.count > 0 ? ('live' as const) : undefined,
        }))}
        tabValue={active?.key ?? ''}
        onTabChange={setTabKey}
        tabsLabel="Delhivery's queue"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Waybill, order, customer, reason…"
      />

      {active?.error ? (
        <p className="text-danger text-xs text-pretty" role="alert">
          Delhivery would not answer for this tab: {active.error}
        </p>
      ) : null}

      {!data.enriched && (active?.items.length ?? 0) > 0 ? (
        // Said once rather than leaving every order cell mysteriously blank.
        <p className="text-subtle-foreground text-xs text-pretty">
          Order numbers could not be matched to these waybills, so only the waybill is shown.
        </p>
      ) : null}

      <Card className="overflow-hidden p-0">
        <Table dense>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Order &amp; waybill</TableHeaderCell>
              <TableHeaderCell>Customer</TableHeaderCell>
              <TableHeaderCell>Payment</TableHeaderCell>
              <TableHeaderCell>Why it failed</TableHeaderCell>
              <TableHeaderCell>Attempts</TableHeaderCell>
              <TableHeaderCell>Delhivery&apos;s clock</TableHeaderCell>
              <TableHeaderCell>What to do</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <p className="text-muted-foreground py-10 text-center text-sm text-pretty">
                    {search.trim()
                      ? 'No parcel in this tab matches that.'
                      : emptyWords(active?.key ?? '')}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((exception: ShipmentException) => (
                <ExceptionRow
                  key={exception.id}
                  brand={brand}
                  exception={exception}
                  canAct={canAct}
                  asked={asked[exception.id]}
                  onAsked={label => setAsked(current => ({ ...current, [exception.id]: label }))}
                />
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

/**
 * What an empty tab means, which is different for each one.
 *
 * A blank table reads as a failure to load. Need Action being empty is the
 * best outcome this page has, and it should say so.
 */
function emptyWords(tabKey: string): string {
  switch (tabKey) {
    case 'NEED_ACTION':
      return 'Delhivery is not waiting on a decision from anyone here. Nothing to do.'
    case 'AUTO_REATTEMPT':
      return 'Delhivery is not retrying anything by itself right now.'
    case 'RETURN_RECOMMENDATION':
      return 'Delhivery is not recommending that any parcel be given up on.'
    case 'CLOSED':
      return 'No exception has been resolved in this window.'
    default:
      return 'Nothing in this tab.'
  }
}

/** The setup notice, which is a different page from an empty queue. */
function NotConnected(): JSX.Element {
  return (
    <Card className="p-8">
      <h2 className="text-foreground text-base font-medium">Delhivery One is not connected</h2>
      <p className="text-muted-foreground mt-2 max-w-prose text-sm text-pretty">
        The tracking API key says where a parcel got to. It cannot say whose decision a parcel is
        waiting on — the words <span className="font-medium">Need Action</span>,{' '}
        <span className="font-medium">Auto Reattempt</span> and{' '}
        <span className="font-medium">Return Recommendation</span> exist only in Delhivery One, and
        reaching it needs a second credential for the same account.
      </p>
      <p className="text-muted-foreground mt-3 max-w-prose text-sm text-pretty">
        Add the client ID, client secret, realm and client UUID under{' '}
        <span className="font-medium">Settings → Integrations → Delhivery</span>. Until then this
        page stays empty rather than guessing, because a guessed queue is how a parcel sits waiting
        on a decision nobody knew they owed.
      </p>
    </Card>
  )
}

function ExceptionRow({
  brand,
  exception,
  canAct,
  asked,
  onAsked,
}: {
  brand: string
  exception: ShipmentException
  canAct: boolean
  asked?: string
  onAsked: (label: string) => void
}): JSX.Element {
  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col gap-0.5">
          {exception.order_name ? (
            <a
              href={exception.admin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent font-mono text-sm whitespace-nowrap underline-offset-4 hover:underline"
            >
              {exception.order_name}
            </a>
          ) : (
            <span className="text-subtle-foreground text-xs">Order not matched</span>
          )}
          <a
            href={
              exception.tracking_url ||
              `https://www.delhivery.com/track/package/${exception.waybill}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-subtle-foreground font-mono text-xs whitespace-nowrap underline-offset-4 hover:underline"
          >
            {exception.waybill}
          </a>
        </div>
      </TableCell>

      <TableCell>
        <span className="block max-w-[12rem] truncate text-sm" title={exception.customer_name}>
          {exception.customer_name || '—'}
        </span>
        {exception.city ? (
          <span className="text-subtle-foreground text-xs">{exception.city}</span>
        ) : null}
      </TableCell>

      <TableCell>
        {/* COD changes the decision: a refused COD parcel is money the shop
            never collects, and another van costs again. */}
        <span className="text-sm">{exception.payment || '—'}</span>
      </TableCell>

      <TableCell>
        <div className="flex flex-col items-start gap-1">
          <Badge tone={exception.sla_breached ? 'danger' : 'warning'}>
            {exception.reason || exception.bucket_name}
          </Badge>
          {/* Delhivery's own filing, so the row can be matched against their
              dashboard without translating anything. */}
          <span className="text-subtle-foreground text-xs">{exception.tab}</span>
          <Proofs exception={exception} />
        </div>
      </TableCell>

      <TableCell numeric>{exception.attempts}</TableCell>

      <TableCell>
        <span className="text-sm whitespace-nowrap">{shortDate(exception.sla_at) || '—'}</span>
        <span className="text-subtle-foreground block text-xs">
          {exception.sla_breached ? 'SLA passed' : 'SLA'}
        </span>
      </TableCell>

      <TableCell>
        <ExceptionActionBar
          brand={brand}
          exception={exception}
          canAct={canAct}
          asked={asked}
          onAsked={onAsked}
        />
      </TableCell>
    </TableRow>
  )
}

/**
 * What the driver can show for the failed delivery.
 *
 * THE EVIDENCE, NOT DECORATION. "Consignee unavailable" logged two kilometres
 * from the address, or after a three-second call, is a different decision from
 * one at the door after a real conversation. Delhivery records both and they
 * decide whether another van is worth paying for, so they sit on the row.
 */
function Proofs({ exception }: { exception: ShipmentException }): JSX.Element | null {
  const { geofence, geofence_distance, call_attempted, call_duration, whatsapp_verified } =
    exception
  if (!geofence && !call_attempted && !whatsapp_verified) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {geofence ? (
        <span
          className="tag tag-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
          title={`The van was ${Math.round(geofence_distance)}m from the address`}
        >
          <MapPin className="size-3" aria-hidden />
          {geofence_distance > 0 ? `${Math.round(geofence_distance)}m` : 'Geofence'}
        </span>
      ) : null}
      {call_attempted ? (
        <span
          className="tag tag-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
          title={
            call_duration > 0
              ? `The driver called for ${call_duration}s`
              : 'The driver called and nobody answered'
          }
        >
          <PhoneCall className="size-3" aria-hidden />
          Called
          {call_duration > 0 ? ` ${call_duration}s` : ''}
        </span>
      ) : null}
      {whatsapp_verified ? (
        <span
          className="tag tag-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
          title="The customer confirmed on WhatsApp"
        >
          <MessageCircle className="size-3" aria-hidden />
          Confirmed
        </span>
      ) : null}
    </div>
  )
}

/** Delhivery's timestamps are RFC3339; the table wants a date, not a stamp. */
function shortDate(value: string): string {
  if (!value) return ''
  const when = new Date(value)
  if (Number.isNaN(when.getTime())) return ''
  return when.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
}

/** A link out for the one thing that is still dashboard-only. */
export function DelhiveryLink(): JSX.Element {
  return (
    <a
      href="https://one.delhivery.com/v2/exceptions/ndr/need-action"
      target="_blank"
      rel="noopener noreferrer"
      className="text-subtle-foreground inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline"
    >
      Open the same queue in Delhivery One
      <ExternalLink className="size-3" aria-hidden />
    </a>
  )
}
