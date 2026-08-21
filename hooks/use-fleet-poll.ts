'use client'

import { useQuery, type DefinedUseQueryResult } from '@tanstack/react-query'

import {
  fetchFleetMachine,
  fetchFleetMachineLive,
  fetchFleetMachines,
} from '@/app/dashboard/[brand]/production/fleet-live-actions'
import type { FleetMachine, FleetMachineLive } from '@/lib/validators/machine-fleet'

/**
 * Polling for printer state, in one place so the cadence is a single decision
 * rather than three that drift apart.
 *
 * Follows the pattern `components/designs/design-detail.tsx` already uses: seed
 * from the server render, poll a server action, vary the interval by state.
 */

/** While something is happening on the bed. */
export const FLEET_POLL_MS = 10_000
/**
 * While nothing is. Backed off rather than stopped: an operator who starts a
 * print from the printer's own touchscreen would otherwise sit in front of a
 * page that says "Ready to print" indefinitely.
 */
const IDLE_POLL_MS = 30_000

/** States where the picture is actually moving, so worth the faster cadence. */
const ACTIVE_STATES = new Set(['RUNNING', 'PREPARE', 'PAUSE'])

interface MachineQueryOptions {
  machineId: string
  initial: FleetMachine
}

interface LiveQueryOptions {
  machineId: string
  initial: FleetMachineLive | null
}

/**
 * The persisted fleet rows, kept fresh by the backend's periodic sync.
 *
 * Polls the database view rather than BambuBuddy, so its cost is a Postgres
 * read - the upstream refresh happens once per interval in the worker no matter
 * how many people are watching.
 */
export function useFleetMachines(initial: FleetMachine[]): DefinedUseQueryResult<FleetMachine[]> {
  return useQuery({
    queryKey: ['fleet-machines'],
    initialData: initial,
    // Overrides the 60s global default: coming back to this page should show
    // the printer's current state, not a cached snapshot of the last visit.
    staleTime: 0,
    queryFn: async (): Promise<FleetMachine[]> => {
      const outcome = await fetchFleetMachines()
      if (!outcome.ok || !outcome.data) {
        throw new Error(outcome.error ?? 'Could not load the machines.')
      }
      return outcome.data
    },
    refetchInterval: query =>
      (query.state.data ?? []).some(m => m.status === 'running') ? FLEET_POLL_MS : IDLE_POLL_MS,
  })
}

/** One persisted fleet row — the batch, countdown and filament view. */
export function useFleetMachine({
  machineId,
  initial,
}: MachineQueryOptions): DefinedUseQueryResult<FleetMachine> {
  return useQuery({
    queryKey: ['fleet-machine', machineId],
    initialData: initial,
    staleTime: 0,
    queryFn: async (): Promise<FleetMachine> => {
      const outcome = await fetchFleetMachine(machineId)
      if (!outcome.ok || !outcome.data) {
        throw new Error(outcome.error ?? 'Could not load the machine.')
      }
      return outcome.data
    },
    refetchInterval: query =>
      query.state.data?.status === 'running' ? FLEET_POLL_MS : IDLE_POLL_MS,
  })
}

/**
 * Live telemetry for one machine, read through to BambuBuddy.
 *
 * `null` is a value, not an error: it means the printer could not be reached,
 * which the card renders as its own explicit state.
 */
export function useFleetMachineLive({
  machineId,
  initial,
}: LiveQueryOptions): DefinedUseQueryResult<FleetMachineLive | null> {
  return useQuery({
    queryKey: ['fleet-machine-live', machineId],
    initialData: initial,
    staleTime: 0,
    queryFn: async (): Promise<FleetMachineLive | null> => {
      const outcome = await fetchFleetMachineLive(machineId)
      if (!outcome.ok) {
        throw new Error(outcome.error ?? 'Could not load live printer status.')
      }
      return outcome.data ?? null
    },
    refetchInterval: query => {
      const live = query.state.data
      if (!live) return IDLE_POLL_MS
      return ACTIVE_STATES.has(live.state) ? FLEET_POLL_MS : IDLE_POLL_MS
    },
  })
}
