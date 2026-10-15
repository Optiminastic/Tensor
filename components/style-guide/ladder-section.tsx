import type { JSX } from 'react'

import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'

import { GuideSection } from './guide-section'

const GIFTING_LADDER = [
  { sp: '₹999', cp: '₹250', pct: '25%' },
  { sp: '₹1,299', cp: '₹325', pct: '25%' },
  { sp: '₹1,499', cp: '₹375', pct: '25%' },
  { sp: '₹1,999', cp: '₹500', pct: '25%' },
  { sp: '₹2,499', cp: '₹625', pct: '25%' },
  { sp: '₹2,999', cp: '₹750', pct: '25%' },
]

/** A table as every list in the product draws one: mono labels, figures right-aligned. */
export function LadderSection(): JSX.Element {
  return (
    <GuideSection
      title="Data"
      caption="The gifting price ladder. Every list is this table: a quiet mono header, hairline rows, figures right-aligned in mono."
    >
      <Card className="overflow-hidden">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Selling price</TableHeaderCell>
              <TableHeaderCell className="text-right">Max Design CP</TableHeaderCell>
              <TableHeaderCell className="text-right">CP ceiling</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {GIFTING_LADDER.map(row => (
              <TableRow key={row.sp}>
                <TableCell className="font-mono tabular-nums">{row.sp}</TableCell>
                <TableCell numeric>{row.cp}</TableCell>
                <TableCell numeric className="text-muted-foreground">
                  {row.pct}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </GuideSection>
  )
}
