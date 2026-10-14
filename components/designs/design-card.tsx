import { Box } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { JSX } from 'react'

import { Badge } from '@/components/ui/badge'
import type { Design } from '@/lib/validators/designs'

import { DesignStatusBadge } from './design-status-badge'
import { LayerTexture } from './layer-texture'

interface DesignCardProps {
  design: Design
  /** In the global "all brands" view, say which brand the design belongs to. */
  showBrand: boolean
}

/** One design as a rounded card: its cover on a printed-layer ground, then the facts. */
export function DesignCard({ design, showBrand }: DesignCardProps): JSX.Element {
  return (
    <Link
      href={`/dashboard/${design.brand_slug}/designs/${design.id}`}
      className="group bg-surface ring-border hover:ring-border-strong flex h-full flex-col overflow-hidden rounded-3xl ring-1 transition-shadow hover:shadow-lg"
    >
      <div className="bg-surface-muted relative aspect-[4/3] overflow-hidden">
        <LayerTexture />
        {design.has_preview ? (
          <Image
            src={`/api/designs/${design.id}/preview`}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-5 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="text-muted-foreground relative flex h-full items-center justify-center">
            <span className="bg-surface ring-border grid size-14 place-items-center rounded-2xl ring-1">
              <Box className="size-6" aria-hidden />
            </span>
          </div>
        )}
        <span className="absolute top-3 left-3">
          <DesignStatusBadge status={design.status} />
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        {showBrand ? (
          <Badge tone="outline" className="w-fit capitalize">
            {design.brand_slug.replace(/-/g, ' ')}
          </Badge>
        ) : null}
        <p className="truncate text-base font-medium tracking-tight">{design.name}</p>
        <p className="text-muted-foreground flex flex-wrap gap-x-2 text-sm">
          <span>{design.material}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{design.units_per_bed} per bed</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{design.infill_pct}% infill</span>
        </p>
        {design.sku ? (
          <p className="text-muted-foreground mt-auto truncate font-mono text-xs whitespace-nowrap tabular-nums">
            {design.sku}
          </p>
        ) : null}
      </div>
    </Link>
  )
}
