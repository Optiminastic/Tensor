import type { JSX } from 'react'

import type { DesignDetail } from '@/lib/validators/designs'

import { DesignFailureRisk } from '../design-failure-risk'
import { DesignOrientation } from '../design-orientation'

import { CompositionTile } from './composition-tile'
import { CostShareTile } from './cost-share-tile'
import { MachineTimeTile } from './machine-time-tile'
import { PriceTile } from './price-tile'
import { SliceFactsTile } from './slice-facts-tile'

interface DesignOverviewBentoProps {
  design: DesignDetail
  onSeePricing: () => void
}

// Each row is narrow, narrow, wide in the DOM, so at two columns the narrow
// tiles pair up and the wide one takes the next row whole. At four columns
// the wide tile is placed in the middle, between the two narrow ones.
const ROW = 'grid gap-4 md:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0 [&>*>*]:h-full'
const WIDE = 'md:col-span-2 xl:col-start-2 xl:row-start-1'
const LAST = 'xl:col-start-4 xl:row-start-1'

/**
 * The design at a glance, in the dashboard's bento rhythm: the price and what
 * the cost is made of on top, the slicer's facts below. A tile whose data is
 * missing is left out rather than shown empty.
 */
export function DesignOverviewBento({
  design,
  onSeePricing,
}: DesignOverviewBentoProps): JSX.Element {
  const { pricing, metrics } = design
  // Without a risk score the slicer row has one tile fewer: let the others close the gap.
  const hasRisk = Boolean(design.failure_risk)
  return (
    <div className="flex flex-col gap-4">
      {pricing ? (
        <div className={ROW}>
          <div>
            <PriceTile pricing={pricing} />
          </div>
          <div className={LAST}>
            <CostShareTile pricing={pricing} onSeePricing={onSeePricing} />
          </div>
          <div className={WIDE}>
            <CompositionTile pricing={pricing} />
          </div>
        </div>
      ) : null}
      {metrics || design.failure_risk ? (
        <div className={ROW}>
          {metrics ? (
            <div className={hasRisk ? undefined : 'md:col-span-2 xl:col-span-1'}>
              <MachineTimeTile metrics={metrics} />
            </div>
          ) : null}
          {design.failure_risk ? (
            <div className={LAST}>
              <DesignFailureRisk risk={design.failure_risk} />
            </div>
          ) : null}
          {metrics ? (
            <div className={hasRisk ? WIDE : `${WIDE} xl:col-span-3`}>
              <SliceFactsTile metrics={metrics} />
            </div>
          ) : null}
        </div>
      ) : null}
      {metrics?.orientation ? <DesignOrientation orientation={metrics.orientation} /> : null}
    </div>
  )
}
