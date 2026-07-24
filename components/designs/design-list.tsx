import Link from 'next/link'
import type { JSX } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import type { Design } from '@/lib/validators/designs'

import { DesignStatusBadge } from './design-status-badge'

interface DesignListProps {
  brand: string
  designs: Design[]
}

/** The brand's designs, newest first, each linking to its pre-check detail. */
export function DesignList({ brand, designs }: DesignListProps): JSX.Element {
  if (designs.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No designs yet. Upload one to run the pre-check.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-border divide-y">
          {designs.map(design => (
            <li key={design.id}>
              <Link
                href={`/dashboard/${brand}/designs/${design.id}`}
                className="hover:bg-surface-muted flex items-center justify-between gap-4 px-4 py-3 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-foreground truncate text-sm font-medium">{design.name}</p>
                  <p className="text-muted-foreground font-mono text-xs tabular-nums">
                    {design.material} / {design.quality} / {design.units_per_bed} per bed /{' '}
                    {design.infill_pct}% infill
                  </p>
                </div>
                <DesignStatusBadge status={design.status} />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
