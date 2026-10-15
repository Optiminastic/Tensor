import { describe, expect, it } from 'vitest'

import type { CPBreakdown } from '@/lib/validators/designs'

import { costSegments } from './cost-segments'

const BREAKDOWN: CPBreakdown = {
  filament: 50,
  machine: 30,
  purge: 10,
  finishing: 10,
  electricity: 0,
  consumables: 0,
  failure_provision: 0,
  subtotal: 100,
  design_cp: 100,
}

describe('costSegments', () => {
  it('keeps the fixed component order and computes shares', () => {
    const segments = costSegments(BREAKDOWN)
    expect(segments.map(s => s.key)).toEqual([
      'filament',
      'machine',
      'purge',
      'finishing',
      'electricity',
      'consumables',
      'failure_provision',
    ])
    expect(segments[0]?.fraction).toBeCloseTo(0.5)
    expect(segments[1]?.fraction).toBeCloseTo(0.3)
  })

  it('treats a negative component as zero', () => {
    const segments = costSegments({ ...BREAKDOWN, purge: -10 })
    expect(segments[2]?.value).toBe(0)
    expect(segments[0]?.fraction).toBeCloseTo(50 / 90)
  })

  it('returns zero shares when every component is zero', () => {
    const zero = costSegments({ ...BREAKDOWN, filament: 0, machine: 0, purge: 0, finishing: 0 })
    expect(zero.every(s => s.fraction === 0)).toBe(true)
  })
})
