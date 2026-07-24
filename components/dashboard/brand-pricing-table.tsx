import type { JSX } from 'react'

import { BrandPricingRow } from '@/components/dashboard/brand-pricing-row'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table'
import type { BrandProfile } from '@/lib/validators/brands'

interface BrandPricingTableProps {
  /** null means the current user could not load brands (no access or backend down). */
  brands: BrandProfile[] | null
}

/**
 * The pricing policy of every brand, exactly as the engine reads it. This is the
 * dashboard's centrepiece: the ladders and CP thresholds that drive every quote.
 */
export function BrandPricingTable({ brands }: BrandPricingTableProps): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand pricing</CardTitle>
        <CardDescription>Ladders and CP thresholds the pricing engine reads live.</CardDescription>
      </CardHeader>

      {brands === null || brands.length === 0 ? (
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {brands === null
              ? 'Could not load brands. Is the backend running?'
              : 'No brands configured yet. Run the seed in Tensor-Core.'}
          </p>
        </CardContent>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Brand</TableHeaderCell>
              <TableHeaderCell className="text-right">Start</TableHeaderCell>
              <TableHeaderCell className="text-right">Ladder</TableHeaderCell>
              <TableHeaderCell className="text-right">CP green / yellow</TableHeaderCell>
              <TableHeaderCell className="text-right">Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {brands.map(brand => (
              <BrandPricingRow key={brand.slug} brand={brand} />
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  )
}
