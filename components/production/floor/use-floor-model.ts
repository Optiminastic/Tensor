'use client'

import { useMemo } from 'react'

import type { BatchRecord, OrderRecord } from '@/components/production/types'
import type { AttentionItem } from '@/lib/dashboard/analytics'
import {
  batchCounts,
  type CountBreakdown,
  fleetRows,
  type FleetRow,
  jobCounts,
  lowFilament,
  orderCounts,
  packedCount,
} from '@/lib/production/floor-model'
import {
  attentionItems,
  bottleneck,
  type FlowStage,
  pipeline,
  type PipelineStage,
} from '@/lib/production/pipeline'
import type { FleetMachine } from '@/lib/validators/machine-fleet'
import type { Filament, ProductionJob } from '@/lib/validators/production'

interface FloorInputs {
  jobs: ProductionJob[]
  batches: BatchRecord[]
  fleet: FleetMachine[]
  filaments: Filament[]
  inRange: { orders: OrderRecord[]; jobs: ProductionJob[]; batches: BatchRecord[] }
}

export interface FloorModel {
  stages: PipelineStage[]
  bottleneck: FlowStage | null
  attention: AttentionItem[]
  orders: CountBreakdown
  jobs: CountBreakdown
  batches: CountBreakdown
  fleet: FleetRow[]
  lowFilament: Filament[]
}

/**
 * Everything the floor shows, derived once per change. The pipeline runs over
 * every job (it is where work is now), except Packed, which is a tally and so
 * counts within the period.
 */
export function useFloorModel({
  jobs,
  batches,
  fleet,
  filaments,
  inRange,
}: FloorInputs): FloorModel {
  const live = useMemo(() => {
    const flow = pipeline(jobs)
    return { flow, bottleneck: bottleneck(flow), attention: attentionItems(jobs) }
  }, [jobs])
  const ranged = useMemo(
    () => ({
      packed: packedCount(inRange.jobs),
      orders: orderCounts(inRange.orders),
      jobs: jobCounts(inRange.jobs),
      batches: batchCounts(inRange.batches),
    }),
    [inRange],
  )
  const stages = useMemo(
    () => live.flow.map(s => (s.key === 'packed' ? { ...s, count: ranged.packed } : s)),
    [live.flow, ranged.packed],
  )
  const fleetModel = useMemo(
    () => fleetRows(fleet, batches, inRange.jobs),
    [fleet, batches, inRange.jobs],
  )
  const low = useMemo(() => lowFilament(filaments), [filaments])
  return {
    stages,
    bottleneck: live.bottleneck,
    attention: live.attention,
    ...ranged,
    fleet: fleetModel,
    lowFilament: low,
  }
}
