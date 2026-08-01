import { Box } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { JSX } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import type { Design } from '@/lib/validators/designs'

import { DesignStatusBadge } from './design-status-badge'

interface DesignListProps {
  brand: string
  designs: Design[]
}

/** The brand's designs as a table/list, newest first, each linking to its
 * pre-check detail. A small cover thumbnail sits beside each row. */
export function DesignList({ brand, designs }: DesignListProps): JSX.Element {
  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-border divide-y">
          {designs.map(design => (
            <li key={design.id}>
              <Link
                href={`/dashboard/${brand}/designs/${design.id}`}
                className="hover:bg-surface-muted flex items-center gap-4 px-4 py-3 transition-colors"
              >
                <div className="border-border bg-surface-muted relative size-11 shrink-0 overflow-hidden rounded-md border">
                  {design.has_preview ? (
                    <Image
                      src={`/api/designs/${design.id}/preview`}
                      alt=""
                      fill
                      unoptimized
                      sizes="44px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="text-subtle-foreground flex h-full items-center justify-center">
                      <Box className="size-4" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-medium">{design.name}</p>
                  <p className="text-muted-foreground font-mono text-xs tabular-nums">
                    {design.material} / {design.quality} / {design.units_per_bed} per bed /{' '}
                    {design.infill_pct}% infill
                  </p>
                </div>
                <DesignStatusBadge status={design.status} className="shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
