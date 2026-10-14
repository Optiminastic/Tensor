import type { JSX } from 'react'

import { OverviewTile } from '@/components/dashboard/overview/overview-tile'
import { TileLabel } from '@/components/dashboard/overview/tile-label'
import { pct } from '@/lib/format'
import type { Margins } from '@/lib/validators/config'

interface MarginsTileProps {
  margins: Margins
  room: number
}

/** The four margins, and the share of a price they leave for cost. */
export function MarginsTile({ margins, room }: MarginsTileProps): JSX.Element {
  const rows: [string, number][] = [
    ['Ad spend', margins.ad_spend_pct],
    ['Team', margins.team_pct],
    ['Overhead', margins.overhead_pct],
    ['Target profit', margins.target_profit_pct],
  ]
  return (
    <OverviewTile tone="lime" label="Room for cost" className="h-full">
      <TileLabel>Room for cost</TileLabel>
      <div className="flex flex-col gap-1">
        <p className="text-5xl font-medium tracking-[-0.04em] tabular-nums">{pct(room)}</p>
        <p className="text-sm opacity-75">of every selling price, after the margins</p>
      </div>
      <ul className="mt-auto flex flex-col gap-1.5 text-sm">
        {rows.map(([label, value]) => (
          <li key={label} className="flex justify-between gap-3">
            <span className="opacity-75">{label}</span>
            <span className="tabular-nums">{pct(value)}</span>
          </li>
        ))}
      </ul>
    </OverviewTile>
  )
}
