import { describe, expect, it } from 'vitest'

import type { BatchRecord } from '@/components/production/types'
import type { FleetMachine } from '@/lib/validators/machine-fleet'
import type { Filament, ProductionJob } from '@/lib/validators/production'

import { fleetRows, lowFilament } from './floor-model'

function filament(id: string, grams: number, reorder: number): Filament {
  return {
    id,
    material: 'PLA',
    grams_available: grams,
    reorder_level_grams: reorder,
    created_at: '',
    updated_at: '',
  }
}

function machine(overrides: Partial<FleetMachine>): FleetMachine {
  return {
    id: 'm1',
    machine_id: 'SN1',
    name: 'H2C 1',
    image_url: null,
    status: 'idle',
    status_reason: null,
    filaments: [],
    current_batch_id: null,
    current_layer: null,
    total_layers: null,
    batch_total_time_minutes: null,
    print_started_at: null,
    remaining_seconds: null,
    total_waste_grams: 0,
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

describe('lowFilament', () => {
  it('keeps spools under their reorder level, emptiest first', () => {
    const low = lowFilament([
      filament('ok', 900, 500),
      filament('half', 250, 500),
      filament('tenth', 50, 500),
    ])
    expect(low.map(f => f.id)).toEqual(['tenth', 'half'])
  })
})

describe('fleetRows', () => {
  const batches = [
    { id: 'b1', machineId: 'm1', status: 'completed' },
    { id: 'b2', machineId: 'm1', status: 'open' },
    { id: 'b3', machineId: 'm1', status: 'pending_approval' },
  ] as BatchRecord[]
  const jobs = [
    { status: 'completed', batch_id: 'b1' },
    { status: 'completed', batch_id: 'b1' },
    { status: 'queued', batch_id: 'b2' },
  ] as ProductionJob[]

  it('counts printed jobs and queued beds per printer', () => {
    const [row] = fleetRows([machine({})], batches, jobs)
    expect(row?.jobsDone).toBe(2)
    expect(row?.queuedBatches).toBe(2)
    expect(row?.progress).toBeNull()
  })

  it('reads progress from layers only while running', () => {
    const running = machine({ status: 'running', current_layer: 30, total_layers: 120 })
    const [row] = fleetRows([running], [], [])
    expect(row?.progress).toBeCloseTo(0.25)
    expect(row?.layers).toBe('Layer 30 of 120')
  })
})
