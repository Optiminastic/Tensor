import type { JSX } from 'react'

import { Badge } from '@/components/ui/badge'
import { TableCell, TableRow } from '@/components/ui/table'
import type { BrandProfile } from '@/lib/validators/brands'

interface BrandPricingRowProps {
  brand: BrandProfile
}

function inr(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`
}

function pct(fraction: number): string {
  return `${Math.round(fraction * 100)}%`
}

/**
 * One brand's pricing policy as a table row: identity, starting price, the
 * ladder's span and rung count, the CP green/yellow ceilings, and whether it is
 * live. Figures are tabular mono; the thresholds are colour-coded to their
 * status so green and yellow read at a glance (the header names which is which).
 */
export function BrandPricingRow({ brand }: BrandPricingRowProps): JSX.Element {
  const low = brand.ladder[0]
  const high = brand.ladder[brand.ladder.length - 1]

  return (
    <TableRow>
      <TableCell>
        <span className="text-foreground font-medium">{brand.name}</span>
        <span className="text-subtle-foreground block text-xs tracking-wide uppercase">
          {brand.slug}
        </span>
      </TableCell>
      <TableCell numeric>{inr(brand.starting_price)}</TableCell>
      <TableCell numeric>
        {inr(low)}
        <span className="text-subtle-foreground">&ndash;</span>
        {inr(high)}
        <span className="text-subtle-foreground block font-sans text-xs tabular-nums">
          {brand.ladder.length} rungs
        </span>
      </TableCell>
      <TableCell numeric>
        <span className="text-success">&le;{pct(brand.cp_green_max)}</span>
        <span className="text-subtle-foreground"> / </span>
        <span className="text-warning">&le;{pct(brand.cp_yellow_max)}</span>
      </TableCell>
      <TableCell className="text-right">
        <Badge tone={brand.is_active ? 'success' : 'neutral'}>
          {brand.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </TableCell>
    </TableRow>
  )
}
