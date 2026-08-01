import type { JSX } from 'react'

import type { OrderLineItem } from '@/components/production/types'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'

interface OrderLineItemsTableProps {
  lineItems: OrderLineItem[]
}

export function OrderLineItemsTable({ lineItems }: OrderLineItemsTableProps): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Products</CardTitle>
      </CardHeader>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Product</TableHeaderCell>
            <TableHeaderCell className="text-right">Quantity</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lineItems.map(item => (
            <TableRow key={item.name}>
              <TableCell>{item.name}</TableCell>
              <TableCell numeric>{item.quantity}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
