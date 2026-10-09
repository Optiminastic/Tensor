'use client'

import { type JSX, useMemo, useState } from 'react'

import { FilterBar } from '@/components/production/filter-bar'
import { REASON_ORDER, reasonLabel } from '@/components/shipping/shipment-reason'
import { ShipmentsTable } from '@/components/shipping/shipments-table'
import { Stat } from '@/components/ui/stat'
import type { TabItem } from '@/components/ui/tabs'
import {
  type Shipment,
  type ShipmentReason,
  type ShipmentsResponse,
  ShipmentReasonSchema,
} from '@/lib/validators/shipments'

interface DeliveriesViewProps {
  data: ShipmentsResponse
}

/** The sentinel tab: no reason filter. */
const ALL = '__all__'

type ReasonFilter = ShipmentReason | typeof ALL

/**
 * The Deliveries page below its title: the numbers, the filter strip, the table.
 *
 * FILTERED IN THE BROWSER, not on the server, even though the backend can do
 * it. The page already receives every parcel in the window - the backend
 * assembles the whole picture and caches it - so narrowing to a reason is a
 * local operation over data that is already here. Making it a round trip
 * bought nothing and cost a page load per click, which is what rate-limited us
 * at the carrier in the first place.
 *
 * That is also what makes the search box possible without a backend change.
 */
export function DeliveriesView({ data }: DeliveriesViewProps): JSX.Element {
  const [reason, setReason] = useState<ReasonFilter>(ALL)
  const [search, setSearch] = useState('')

  // Only buckets with parcels in them. A tab strip of zeroes reads as a
  // taxonomy to learn rather than a list to narrow, and which buckets are
  // empty changes day to day.
  const tabs: TabItem[] = useMemo(
    () => [
      { value: ALL, label: 'All', count: data.shipped },
      ...REASON_ORDER.filter(key => (data.counts[key] ?? 0) > 0).map(key => ({
        value: key,
        label: reasonLabel(key),
        count: data.counts[key] ?? 0,
        // 'live' colours the count on the buckets that are somebody's work, so
        // the number that matters is findable without reading every tab.
        countTone: ACTIONABLE_REASONS.has(key) ? ('live' as const) : ('default' as const),
      })),
    ],
    [data.counts, data.shipped],
  )

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return data.items.filter(shipment => {
      if (reason !== ALL && shipment.reason !== reason) return false
      if (!needle) return true
      return searchText(shipment).includes(needle)
    })
  }, [data.items, reason, search])

  const unavailable = data.counts.consignee_unavailable ?? 0
  const delivered = data.counts.delivered ?? 0
  const otherCarriers = Object.entries(data.other_carriers)

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Needs attention leads, because it is the only figure here that is
            a to-do list rather than a fact. */}
        <Stat
          label="Needs attention"
          value={data.actionable}
          hint={data.actionable === 0 ? 'Nothing is stuck right now.' : 'Sorted to the top.'}
          subCounts={[
            {
              label: 'Unavailable',
              value: unavailable,
              tone: unavailable > 0 ? 'danger' : 'muted',
            },
            { label: 'Other', value: Math.max(data.actionable - unavailable, 0) },
          ]}
        />
        <Stat
          label="In transit"
          value={data.counts.moving ?? 0}
          hint="Moving normally."
          subCounts={[{ label: 'Carrier delay', value: data.counts.carrier_delay ?? 0 }]}
        />
        <Stat label="Delivered" value={delivered} hint={`In the last ${data.window_days} days.`} />
        <Stat
          label="Tracked"
          value={data.tracked}
          hint={
            data.generated_at
              ? `Read from Delhivery at ${clock(data.generated_at)}.`
              : 'Read from Delhivery.'
          }
          subCounts={
            // Only when there are any. A permanent "Other carriers 0" row
            // would be noise on every normal day.
            otherCarriers.length > 0
              ? otherCarriers.map(([name, count]) => ({
                  label: name,
                  value: count,
                  tone: 'warning' as const,
                }))
              : undefined
          }
        />
      </div>

      {/* Said out loud rather than left as a silent gap: the store ships some
          orders by another carrier, and Delhivery's API knows nothing about
          those waybills. A page that looks complete and is not is worse than
          one that admits the hole. */}
      {otherCarriers.length > 0 ? (
        <p className="text-muted-foreground text-sm text-pretty">
          Tensor reads Delhivery only.{' '}
          {otherCarriers.map(([name, count]) => `${count} by ${name}`).join(', ')} — those have to
          be tracked with their own carrier.
        </p>
      ) : null}

      <FilterBar
        tabs={tabs}
        tabValue={reason}
        // FilterBar hands back a plain string, so the value is parsed rather
        // than cast: an id that is not a reason falls back to "All" instead of
        // filtering the table down to nothing.
        onTabChange={value => {
          const parsed = ShipmentReasonSchema.safeParse(value)
          setReason(parsed.success ? parsed.data : ALL)
        }}
        tabsLabel="Filter deliveries by reason"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search order, waybill, customer, city…"
      />

      {rows.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed px-4 py-8 text-center text-sm text-pretty">
          {emptyMessage(data, reason, search)}
        </p>
      ) : (
        <ShipmentsTable shipments={rows} />
      )}
    </>
  )
}

/**
 * The buckets that are somebody's work.
 *
 * Mirrors delhivery.Reason.Actionable in the backend, and only for COLOUR -
 * every row carries the backend's own `actionable` flag, which is what the
 * table and the sort use. Duplicating the rule here would be a second source
 * of truth; duplicating which tabs get a red number is a presentation detail.
 */
const ACTIONABLE_REASONS: ReadonlySet<ShipmentReason> = new Set([
  'consignee_unavailable',
  'attempts_exhausted',
  'consignee_refused',
  'address_problem',
  'payment_not_ready',
  'rescheduled',
  'audit',
  'other',
  'untracked',
])

/**
 * Everything about one parcel that somebody might type into the box.
 *
 * Deliberately wide: an operator searching here has a customer on the phone
 * and whatever that customer gave them - an order number, a tracking number
 * they read off an email, a name, a town. Restricting it to the order number
 * would make them guess which field the box wants.
 */
function searchText(shipment: Shipment): string {
  return [
    shipment.order_name,
    shipment.waybill,
    shipment.customer_name,
    shipment.phone,
    shipment.city,
    shipment.state,
    shipment.pincode,
    shipment.instruction,
    shipment.reason_label,
    ...shipment.line_items.map(item => item.title),
  ]
    .join(' ')
    .toLowerCase()
}

/** Which kind of nothing this is - the three cases need different sentences. */
function emptyMessage(data: ShipmentsResponse, reason: ReasonFilter, search: string): string {
  if (search.trim()) return `Nothing matches “${search.trim()}”.`
  if (data.shipped === 0) {
    return `Nothing has shipped by Delhivery in the last ${data.window_days} days.`
  }
  if (reason !== ALL) {
    return `No delivery is ${reasonLabel(reason).toLowerCase()} right now.`
  }
  return 'Delhivery has nothing to report on any of these parcels.'
}

function clock(raw: string): string {
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}
