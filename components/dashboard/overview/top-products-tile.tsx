import type { JSX } from 'react'

import { OverviewTile } from '@/components/dashboard/overview/overview-tile'
import { TileLabel } from '@/components/dashboard/overview/tile-label'
import type { TopProduct } from '@/lib/dashboard/analytics'

interface TopProductsTileProps {
  products: TopProduct[]
}

/** What the floor is making most of: ranked by units across all jobs. */
export function TopProductsTile({ products }: TopProductsTileProps): JSX.Element {
  return (
    <OverviewTile label="Top products">
      <TileLabel>Top products</TileLabel>
      {products.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No production jobs yet. They appear here once orders are synced.
        </p>
      ) : (
        <ol className="flex flex-col">
          {products.map((p, i) => (
            <li
              key={p.name}
              className="border-border flex items-center gap-4 border-b py-3 last:border-b-0"
            >
              <span className="text-muted-foreground w-5 font-mono text-xs tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
              <span className="font-mono text-sm tabular-nums">{p.units} units</span>
            </li>
          ))}
        </ol>
      )}
    </OverviewTile>
  )
}
