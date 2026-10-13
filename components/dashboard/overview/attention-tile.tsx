import { AlertTriangle, ArrowUpRight, CircleAlert } from 'lucide-react'
import Link from 'next/link'
import type { JSX } from 'react'

import { OverviewTile } from '@/components/dashboard/overview/overview-tile'
import { TileLabel } from '@/components/dashboard/overview/tile-label'
import type { AttentionItem } from '@/lib/dashboard/analytics'

interface AttentionTileProps {
  items: AttentionItem[]
  brandHref: string
}

/** How many held or overdue jobs the ink tile lists before linking out. */
const SHOWN = 3

/** The ink tile: jobs a person has to unblock, each one a link to the job. */
export function AttentionTile({ items, brandHref }: AttentionTileProps): JSX.Element {
  return (
    <OverviewTile tone="ink" label="Needs attention">
      <TileLabel>Needs attention</TileLabel>
      <p className="text-6xl font-medium tracking-[-0.04em] tabular-nums">{items.length}</p>
      {items.length === 0 ? (
        <p className="mt-auto text-sm text-white">All clear - nothing held or overdue.</p>
      ) : (
        <ul className="mt-auto flex flex-col gap-2">
          {items.slice(0, SHOWN).map(item => (
            <li key={item.id}>
              <Link
                href={`${brandHref}/production/jobs/${item.id}`}
                className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5 text-sm transition-colors hover:bg-white/15"
              >
                {item.severity === 'danger' ? (
                  <CircleAlert className="size-4 shrink-0" aria-label="Overdue" />
                ) : (
                  <AlertTriangle className="size-4 shrink-0" aria-label="On hold" />
                )}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-mono text-xs tabular-nums">{item.jobNumber}</span>
                  <span className="truncate">{item.reason}</span>
                </span>
                <ArrowUpRight className="size-4 shrink-0" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </OverviewTile>
  )
}
