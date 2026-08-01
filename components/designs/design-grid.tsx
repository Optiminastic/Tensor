import { Box } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { JSX } from 'react'

import type { Design } from '@/lib/validators/designs'

import { DesignStatusBadge } from './design-status-badge'

interface DesignGridProps {
  brand: string
  designs: Design[]
}

/** The brand's designs as a cover-image grid, each card linking to its pre-check. */
export function DesignGrid({ brand, designs }: DesignGridProps): JSX.Element {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {designs.map(design => (
        <li key={design.id}>
          <Link
            href={`/dashboard/${brand}/designs/${design.id}`}
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
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
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
              <p className="text-foreground truncate text-sm font-medium">{design.name}</p>
              <p className="text-muted-foreground truncate font-mono text-xs tabular-nums">
                {design.material} / {design.quality} / {design.infill_pct}% infill
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
