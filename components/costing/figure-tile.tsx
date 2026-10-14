import type { JSX } from 'react'

import { OverviewTile } from '@/components/dashboard/overview/overview-tile'
import { TileLabel } from '@/components/dashboard/overview/tile-label'

interface FigureTileProps {
  tone: 'lime' | 'ink' | 'paper'
  label: string
  value: string
  hint: string
}

/** One headline figure as a bento tile: label, the number, one line of context. */
export function FigureTile({ tone, label, value, hint }: FigureTileProps): JSX.Element {
  return (
    <OverviewTile tone={tone} label={label} className="h-full justify-between">
      <TileLabel>{label}</TileLabel>
      <p className="text-5xl font-medium tracking-[-0.04em] tabular-nums">{value}</p>
      <p className="text-sm opacity-75">{hint}</p>
    </OverviewTile>
  )
}
