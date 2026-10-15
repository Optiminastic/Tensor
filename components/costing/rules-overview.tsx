import type { JSX } from 'react'

import { OverviewTile } from '@/components/dashboard/overview/overview-tile'
import { TileFigure } from '@/components/dashboard/overview/tile-figure'
import { TileLabel } from '@/components/dashboard/overview/tile-label'
import { costRoom, fixedCostTotal } from '@/lib/costing/rules'
import { inr, pct } from '@/lib/format'
import type { CostAssumption } from '@/lib/validators/config'

import { MarginsTile } from './margins-tile'

interface RulesOverviewProps {
  rules: CostAssumption | null
}

interface RulesTileProps {
  rules: CostAssumption
}

/**
 * The pricing rules in force, read at a glance: what a design's cost is built
 * from, what every order carries on top, and how much of a price the margins
 * leave for cost. Editing happens in the dialog in the page heading.
 */
export function RulesOverview({ rules }: RulesOverviewProps): JSX.Element {
  if (!rules) {
    return (
      <OverviewTile label="No rules yet">
        <TileLabel>No rules yet</TileLabel>
        <p className="text-muted-foreground text-sm">
          No pricing rules are saved, so the engine uses its built-in defaults. Edit the pricing
          rules to set your own.
        </p>
      </OverviewTile>
    )
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0">
      <div className="md:col-span-2">
        <CostRatesTile rules={rules} />
      </div>
      <MarginsTile margins={rules.margins} room={costRoom(rules.margins)} />
      <FixedCostsTile rules={rules} />
    </div>
  )
}

function CostRatesTile({ rules }: RulesTileProps): JSX.Element {
  return (
    <OverviewTile label="Design CP cost rates" className="h-full">
      <TileLabel>Design CP cost rates</TileLabel>
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
        <TileFigure label="Filament" value={inr(rules.filament_cost_per_kg)} hint="per kg" />
        <TileFigure label="Machine time" value={inr(rules.machine_hour_cost)} hint="per hour" />
        <TileFigure label="Finishing labour" value={inr(rules.finishing_labour)} hint="per unit" />
        <TileFigure label="Consumables" value={inr(rules.consumables)} hint="per unit" />
        <TileFigure
          label="Electricity"
          value={inr(rules.electricity_cost_per_unit)}
          hint="per unit"
        />
        <TileFigure label="Failure provision" value={pct(rules.failure_pct)} hint="of the cost" />
      </div>
    </OverviewTile>
  )
}

function FixedCostsTile({ rules }: RulesTileProps): JSX.Element {
  const f = rules.fixed_costs
  const rows: [string, number][] = [
    ['Packaging', f.packaging],
    ['Shipping', f.shipping],
    ['RTO / COD', f.rto_cod],
    ['Payment gateway', f.payment_gateway],
    ['Tech allocation', f.tech_allocation],
    ['Other', f.other],
  ]
  return (
    <OverviewTile tone="ink" label="Fixed costs per order" className="h-full">
      <TileLabel>Fixed costs per order</TileLabel>
      <p className="text-5xl font-medium tracking-[-0.04em] tabular-nums">
        {inr(fixedCostTotal(f))}
      </p>
      <ul className="mt-auto flex flex-col gap-1.5 text-sm">
        {rows.map(([label, value]) => (
          <li key={label} className="flex justify-between gap-3">
            <span className="opacity-75">{label}</span>
            <span className="tabular-nums">{inr(value)}</span>
          </li>
        ))}
      </ul>
    </OverviewTile>
  )
}
