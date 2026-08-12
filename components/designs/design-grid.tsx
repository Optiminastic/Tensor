import { Box } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { JSX } from 'react'

import { Badge } from '@/components/ui/badge'
import type { Design } from '@/lib/validators/designs'

import { DesignStatusBadge } from './design-status-badge'

interface DesignGridProps {
  designs: Design[]
  // In the global "all brands" view, label each card with the brand it belongs to.
  showBrand: boolean
}

/** The designs as a cover-image grid, each card linking to its pre-check under
 * its own brand. In the global view each card is labelled with its brand. Delete
 * and archive live on the design's Settings tab, not on the card. */
export function DesignGrid({ designs, showBrand }: DesignGridProps): JSX.Element {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {designs.map(design => (
        <li key={design.id} className="relative">
          <Link
            href={`/dashboard/${design.brand_slug}/designs/${design.id}`}
            className="group flex flex-col gap-2"
          >
            <div className="border-border bg-surface-muted relative aspect-[4/3] overflow-hidden rounded-lg border">
              {design.has_preview ? (
                <Image
                  src={`/api/designs/${design.id}/preview`}
                  alt=""
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-contain p-4 transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <div className="text-subtle-foreground flex h-full items-center justify-center">
                  <Box className="size-8" aria-hidden />
                </div>
              )}
              <span className="absolute top-2 left-2">
                <DesignStatusBadge status={design.status} />
              </span>
            </div>
            <div className="min-w-0">
              {showBrand ? (
                <Badge tone="outline" className="mb-1 capitalize">
                  {design.brand_slug.replace(/-/g, ' ')}
                </Badge>
              ) : null}
              <p className="text-foreground truncate text-sm font-medium">{design.name}</p>
              <p className="text-muted-foreground truncate font-mono text-xs tabular-nums">
                {design.material} / {design.quality} / {design.infill_pct}% infill
              </p>
              {design.sku ? (
                <p className="text-subtle-foreground truncate font-mono text-xs tabular-nums">
                  SKU {design.sku}
                </p>
              ) : null}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
