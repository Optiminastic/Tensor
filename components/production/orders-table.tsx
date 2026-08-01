import type { JSX } from 'react'

import { OrderRow } from '@/components/production/order-row'
import type { OrderRecord } from '@/components/production/types'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table'

interface OrdersTableProps {
  brand: string
  orders: OrderRecord[]
}

const COLUMNS = ['Order', 'Store', 'Customer', 'Submitted', 'Total', 'Payment']

export function OrdersTable({ brand, orders }: OrdersTableProps): JSX.Element {
  return (
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
          {orders.map(order => (
            <OrderRow key={order.id} brand={brand} order={order} />
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
