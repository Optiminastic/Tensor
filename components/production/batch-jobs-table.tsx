import Link from 'next/link'
import type { JSX } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import type { ProductionJob } from '@/lib/validators/production'

interface BatchJobsTableProps {
  brand: string
  jobs: ProductionJob[]
}

export function BatchJobsTable({ brand, jobs }: BatchJobsTableProps): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Jobs in this batch</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Job</TableHeaderCell>
              <TableHeaderCell>Product</TableHeaderCell>
              <TableHeaderCell>SKU</TableHeaderCell>
              <TableHeaderCell className="text-right">Quantity</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map(job => (
              <TableRow key={job.id}>
                <TableCell className="font-mono text-sm">
                  <Link
                    href={`/dashboard/${brand}/production/jobs/${job.id}`}
                    className="text-accent hover:underline"
                  >
                    {job.job_number}
                  </Link>
                </TableCell>
                <TableCell>{job.product_name ?? job.description}</TableCell>
                <TableCell className="text-muted-foreground font-mono text-sm">
                  {job.sku ?? '—'}
                </TableCell>
                <TableCell numeric>{job.quantity}</TableCell>
                <TableCell className="text-muted-foreground">{job.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
