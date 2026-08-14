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
import { ORDER_STATUS_CONFIG } from '@/components/production/status-config'
import type { OrderRecord, OrderStatus } from '@/components/production/types'
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

interface OrdersTableProps {
  brand: string
  orders: OrderRecord[]
}

const COLUMNS = ['Order', 'Store', 'Customer', 'Submitted', 'Total', 'Payment']
const STATUSES = Object.keys(ORDER_STATUS_CONFIG) as OrderStatus[]

function matchesSearch(order: OrderRecord, search: string): boolean {
  if (!search) return true
  const haystack = `${order.orderNumber} ${order.customer ?? ''} ${order.customerEmail ?? ''}`
    .trim()
    .toLowerCase()
  return haystack.includes(search.trim().toLowerCase())
}

export function OrdersTable({ brand, orders }: OrdersTableProps): JSX.Element {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  // All time, not the week-long DEFAULT_PERIOD: this table has always shown
  // every order, and opening it pre-filtered to a week would read as missing
  // data rather than as a filter the user applied.
  const [period, setPeriod] = useState<PeriodValue>(ALL_TIME_PERIOD)

  const periodRange = useMemo(() => resolvePeriod(period, new Date()), [period])

  const tabs: TabItem[] = useMemo(
    () => [
      { value: '', label: 'All', count: orders.length },
      ...STATUSES.map(s => ({
        value: s,
        label: ORDER_STATUS_CONFIG[s].label,
        count: orders.filter(o => o.status === s).length,
      })),
    ],
    [orders],
  )

  const filtered = useMemo(
    () =>
      orders.filter(
        order =>
          matchesSearch(order, search) &&
          (!status || order.status === status) &&
          isWithinDateRange(order.submittedAt, periodRange),
      ),
    [orders, search, status, periodRange],
  )

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        tabs={tabs}
        tabValue={status}
        onTabChange={setStatus}
        tabsLabel="Filter orders by payment status"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search order #, customer, email"
        period={period}
        onPeriodChange={setPeriod}
      />
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              {COLUMNS.map(column => (
                <TableHeaderCell key={column}>{column}</TableHeaderCell>
              ))}
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
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
              filtered.map(order => <OrderRow key={order.id} brand={brand} order={order} />)
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
