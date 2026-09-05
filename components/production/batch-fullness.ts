import type { BatchRecord } from '@/components/production/types'

// Matches production.TargetBedUtilisationPercent (internal/production/planner.go) -
// the threshold the optimiser packs to.
const FULL_BATCH_UTILIZATION_PERCENT = 80

// Matches production.MaxColourBatchUnits (internal/production/colourbatch.go) -
// how many products the colour rule allows on one bed.
const MAX_COLOUR_BATCH_UNITS = 4

// Matches production.StrategyColour: the packing_strategy a batch records when
// the colour rule built it, as opposed to one of the optimiser's orderings.
const COLOUR_STRATEGY = 'colour'

type FullnessInput = Pick<BatchRecord, 'bedUtilizationPercent' | 'unitsPerBed' | 'packingStrategy'>

/**
 * Whether a batch has room for another job.
 *
 * This gates the "add jobs" dialog, so getting it wrong is not cosmetic: too
 * permissive and an operator quietly builds a bed the rule forbids.
 *
 * Which limit applies depends on how the bed was built, and the two are not
 * interchangeable. The optimiser packs to 80% of the bed's area. The colour rule
 * caps the COUNT instead - four planks cover 37.9% of a 330x320 bed, so an area
 * threshold of 80% would never be reached and every colour bed would advertise
 * room for a fifth, sixth and seventh plank.
 */
export function isBatchFull(batch: FullnessInput): boolean {
  if (batch.packingStrategy === COLOUR_STRATEGY) {
    return (batch.unitsPerBed ?? 0) >= MAX_COLOUR_BATCH_UNITS
  }
  return (batch.bedUtilizationPercent ?? 0) >= FULL_BATCH_UTILIZATION_PERCENT
}

/**
 * Whether a bed's membership can still be changed by hand.
 *
 * Draft and Locked, matching the backend's editableBatch. A locked bed used to
 * be final, which meant the only way to pull one bad plank was to delete the bed
 * and lose the three beside it; editing one now withdraws its plate from the
 * printer queue, changes it, and re-plates what is left.
 *
 * Printing and Completed are records of what physically happened - a plate on a
 * machine, or one that has come off it - so those stay closed.
 */
export function isBatchEditable(batch: Pick<BatchRecord, 'status'>): boolean {
  return batch.status === 'pending_approval' || batch.status === 'open'
}
