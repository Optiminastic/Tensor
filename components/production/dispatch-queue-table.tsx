'use client'

import type { JSX } from 'react'

import { TablePagination } from '@/components/production/table-pagination'
import type { DispatchReadyOrder } from '@/components/production/types'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import { usePagination } from '@/hooks/use-pagination'

const COLUMNS = ['Order', 'Customer', 'Items']

interface DispatchQueueTableProps {
  readyOrders: DispatchReadyOrder[]
}

/**
 * The end of the board: orders whose every job has been packed.
 *
 * NO ACTIONS, DELIBERATELY. The four stations before this are work somebody
 * performs and ticks off; dispatch is where the order has left the floor, so
 * there is nothing to do here and a button would only invite somebody to
 * press it.
 *
 * SHIPMENT RECORDS ARE NOT SHOWN HERE EITHER. Carrier, waybill and where a
 * parcel actually got to belong to Shipping, which reads them live from the
 * courier - repeating a stale copy on the production board would give two
 * answers to one question. This tab answers only "is it finished".
 */
export function DispatchQueueTable({ readyOrders }: DispatchQueueTableProps): JSX.Element {
  const page = usePagination(readyOrders)

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        {readyOrders.length > 0
          ? `${readyOrders.length} ${readyOrders.length === 1 ? 'order has' : 'orders have'} come off the floor.`
          : 'Nothing has reached dispatch yet.'}
      </p>

      <Card>
        <Table>
          <TableHead>
            <TableRow>
              {COLUMNS.map(column => (
                <TableHeaderCell key={column}>{column}</TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {page.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} className="text-muted-foreground">
                  Nothing here yet. Orders arrive once every job on them has been packed.
                </TableCell>
              </TableRow>
            ) : (
              page.items.map(order => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm whitespace-nowrap">
                    {order.orderNumber}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.customerName ?? '—'}
                  </TableCell>
                  <TableCell numeric>{order.jobCount}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination page={page} noun="orders" />
      </Card>
    </div>
  )
}
