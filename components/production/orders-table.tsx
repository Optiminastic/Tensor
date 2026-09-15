'use client'

import { useMemo, useState, type JSX } from 'react'

import {
  ALL_TIME_PERIOD,
  isWithinDateRange,
  type PeriodValue,
  resolvePeriod,
} from '@/components/production/date-range'
import { FilterBar } from '@/components/production/filter-bar'
import { OrderRow } from '@/components/production/order-row'
import { TablePagination } from '@/components/production/table-pagination'
import type { OrderRecord } from '@/components/production/types'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import type { TabItem } from '@/components/ui/tabs'
import { usePagination } from '@/hooks/use-pagination'
import { useQueryTab } from '@/hooks/use-query-tab'

interface OrdersTableProps {
  brand: string
  orders: OrderRecord[]
  /**
   * Orders that produced no production jobs at all, by id. Resolved on the
   * server because the order DTO carries no job count.
   */
  orderIdsWithoutJobs: string[]
}

/**
 * The tab value for "made no jobs".
 *
 * An operator opening Orders is looking for what needs attention, and this is
 * the most important question on the page - so it sits in the tab strip rather
 * than behind a second control somewhere else. The sentinel is hyphenated so it
 * cannot collide with a status value.
 */
const NO_JOBS_TAB = 'no-jobs'

/**
 * The tab value for "already shipped".
 *
 * A fulfilled order is finished: its plank was made and posted, so it is not
 * work for the floor and Tensor no longer creates jobs for it (see
 * ShouldCreateJobs). Half the store's orders are in that state, and mixing them
 * with live ones is what makes the list hard to read - this is the pile you can
 * safely stop looking at.
 */
const DONE_TAB = 'done'

/**
 * The tab value for "still to ship".
 *
 * The counterpart to Done, and the tab that answers what the floor is actually
 * for: everything not yet posted. It replaces Pending, which asked about
 * PAYMENT and read zero on every order the store has ever taken - a tab nobody
 * could use, sitting where the useful question belongs.
 *
 * Anything not fulfilled counts, including partially fulfilled and an order with
 * no fulfilment status at all: part of an order having shipped still leaves a
 * plank to make, and an order the store has said nothing about is not finished.
 */
const UNFULFILLED_TAB = 'unfulfilled'

// The same information Shopify's own order list carries, in the same reading
// order, so an operator with both open can compare them without re-finding
// every figure. The presentation is Tensor's throughout - its pills, its
// typography, its mono figures - only the columns are borrowed.
//
// Thirteen columns is wider than the viewport, which is why the Table
// primitive scrolls horizontally rather than wrapping.
const COLUMNS = [
  'Order',
  'Date',
  'Customer',
  'Total',
  'Items',
  'Fulfillment',
  'Delivery method',
  'Payment',
  'Delivery status',
  'Tags',
  'Channel',
  'Return',
]
// No payment status has a tab any more.
//
// Every order the store imports is already paid - all 429 of them - so Paid
// selected exactly what All showed, and Pending, Refunded and Cancelled
// selected nothing at all. Four slots in the strip that never narrowed the
// list. What remains asks questions with answers that differ: what has not
// shipped, what made no jobs, what is finished.
//
// The statuses stay in ORDER_STATUS_CONFIG, which renders each row's payment
// pill, so an order that does arrive refunded or cancelled still reads
// correctly in the table - it simply has no tab of its own. Search and the
// row's own pill are how it would be found.

function matchesSearch(order: OrderRecord, search: string): boolean {
  if (!search) return true
  // The names the customer typed on the plank, alongside their own. Someone
  // ringing up about "the Farsana one" has the plank's names, not the buyer's.
  const haystack = `${order.orderNumber} ${order.customer ?? ''} ${order.customerEmail ?? ''} ${(
    order.personalisationNames ?? []
  ).join(' ')}`
    .trim()
    .toLowerCase()
  return haystack.includes(search.trim().toLowerCase())
}

/** Whether the store says this order has shipped. */
function isDone(order: OrderRecord): boolean {
  return (order.fulfillmentStatus ?? '').trim().toLowerCase() === 'fulfilled'
}

/** Whether this order is still to ship. */
function isUnfulfilled(order: OrderRecord): boolean {
  return !isDone(order)
}

/** Whether an order belongs under the selected tab. '' is All. */
function matchesTab(order: OrderRecord, tab: string, withoutJobs: Set<string>): boolean {
  if (!tab) return true
  if (tab === NO_JOBS_TAB) return withoutJobs.has(order.id)
  if (tab === DONE_TAB) return isDone(order)
  if (tab === UNFULFILLED_TAB) return isUnfulfilled(order)
  return order.status === tab
}

export function OrdersTable({ brand, orders, orderIdsWithoutJobs }: OrdersTableProps): JSX.Element {
  const withoutJobs = useMemo(() => new Set(orderIdsWithoutJobs), [orderIdsWithoutJobs])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useQueryTab<string>('status', '')
  // All time, not the week-long DEFAULT_PERIOD: this table has always shown
  // every order, and opening it pre-filtered to a week would read as missing
  // data rather than as a filter the user applied.
  const [period, setPeriod] = useState<PeriodValue>(ALL_TIME_PERIOD)

  const periodRange = useMemo(() => resolvePeriod(period, new Date()), [period])

  const tabs: TabItem[] = useMemo(
    () => [
      { value: '', label: 'All', count: orders.length },
      {
        value: UNFULFILLED_TAB,
        label: 'Unfulfilled',
        count: orders.filter(isUnfulfilled).length,
      },
      {
        value: NO_JOBS_TAB,
        label: 'No jobs',
        count: orders.filter(o => withoutJobs.has(o.id)).length,
      },
      // Last in the strip, after the question that needs attention: Done is
      // where finished work goes to be out of the way, not something to check.
      { value: DONE_TAB, label: 'Done', count: orders.filter(isDone).length },
    ],
    [orders, withoutJobs],
  )

  const filtered = useMemo(
    () =>
      orders.filter(
        order =>
          matchesSearch(order, search) &&
          matchesTab(order, status, withoutJobs) &&
          isWithinDateRange(order.submittedAt, periodRange),
      ),
    [orders, search, status, periodRange, withoutJobs],
  )
  const page = usePagination(filtered)

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        tabs={tabs}
        tabValue={status}
        onTabChange={setStatus}
        tabsLabel="Filter orders by payment status, missing jobs, or fulfilment"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search order #, customer, name on plank"
        period={period}
        onPeriodChange={setPeriod}
      />
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              {COLUMNS.map(column => (
                <TableHeaderCell key={column} className="py-2 whitespace-nowrap">
                  {column}
                </TableHeaderCell>
              ))}
              <TableHeaderCell className="py-2 text-right whitespace-nowrap">
                Actions
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMNS.length + 1}
                  className="text-muted-foreground text-center text-sm"
                >
                  No orders match these filters.
                </TableCell>
              </TableRow>
            ) : (
              page.items.map(order => <OrderRow key={order.id} brand={brand} order={order} />)
            )}
          </TableBody>
        </Table>
        <TablePagination page={page} noun="orders" />
      </Card>
    </div>
  )
}
