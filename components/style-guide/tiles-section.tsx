import type { JSX } from 'react'

import { OverviewTile } from '@/components/dashboard/overview/overview-tile'
import { TileLabel } from '@/components/dashboard/overview/tile-label'

import { GuideSection } from './guide-section'
import { TabsDemo } from './tabs-demo'

const TILES: { tone: 'surface' | 'paper' | 'lime' | 'ink'; label: string; value: string }[] = [
  { tone: 'lime', label: 'Recommended price', value: '₹899' },
  { tone: 'ink', label: 'Orders', value: '64' },
  { tone: 'surface', label: 'Cost share', value: '31.8%' },
  { tone: 'paper', label: 'Filament', value: '62 g' },
]

/** The bento tiles every overview is built from, and the pill tabs above lists. */
export function TilesSection(): JSX.Element {
  return (
    <GuideSection
      title="Tiles and tabs"
      caption="Overviews are bento grids of rounded tiles: one lime headline, ink for a count, surface and paper for the rest. Lists sit under pill tabs with their counts."
    >
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {TILES.map(tile => (
            <OverviewTile key={tile.label} tone={tile.tone} label={tile.label}>
              <TileLabel>{tile.label}</TileLabel>
              <p className="text-4xl font-medium tracking-[-0.04em] tabular-nums">{tile.value}</p>
            </OverviewTile>
          ))}
        </div>
        <TabsDemo />
      </div>
    </GuideSection>
  )
}
