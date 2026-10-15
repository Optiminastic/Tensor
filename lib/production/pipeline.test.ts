import { describe, expect, it } from 'vitest'

import type { ProductionJob } from '@/lib/validators/production'

import { attentionItems, bottleneck, jobStage, pipeline } from './pipeline'

function job(overrides: Partial<ProductionJob>): ProductionJob {
  return {
    id: 'j1',
    job_number: 'T3DPS-1-1',
    description: 'Dual Name Plank',
    quantity: 1,
    status: 'queued',
    assembly_status: 'pending',
    finishing_status: 'pending',
    qc_status: 'pending',
    packaging_status: 'pending',
    personalisation_status: 'validated',
    priority: 0,
    held: false,
    created_at: '2026-10-14T00:00:00Z',
    ...overrides,
  } as ProductionJob
}

describe('jobStage', () => {
  it('splits queued jobs by whether they are on a bed yet', () => {
    expect(jobStage(job({}))).toBe('to_batch')
    expect(jobStage(job({ batch_id: 'b1' }))).toBe('batched')
  })

  it('treats in_production (and the older "printing") as printing', () => {
    expect(jobStage(job({ status: 'in_production' }))).toBe('printing')
    expect(jobStage(job({ status: 'printing' }))).toBe('printing')
  })

  it('walks a printed job through the stations, skipping not_required', () => {
    const printed = { status: 'completed' }
    expect(jobStage(job(printed))).toBe('assembly')
    expect(jobStage(job({ ...printed, assembly_status: 'not_required' }))).toBe('finishing')
    expect(
      jobStage(job({ ...printed, assembly_status: 'completed', finishing_status: 'not_required' })),
    ).toBe('qc')
    const passed = {
      ...printed,
      assembly_status: 'completed',
      finishing_status: 'completed',
      qc_status: 'passed',
    }
    expect(jobStage(job(passed))).toBe('packing')
    expect(jobStage(job({ ...passed, packaging_status: 'packaged' }))).toBe('packed')
  })

  it('puts failed, held and flagged jobs in issues, whatever else they say', () => {
    expect(jobStage(job({ status: 'failed' }))).toBe('issue')
    expect(jobStage(job({ held: true }))).toBe('issue')
    expect(jobStage(job({ issue_reason: 'sku_missing' }))).toBe('issue')
    expect(jobStage(job({ status: 'completed', qc_status: 'failed' }))).toBe('issue')
  })
})

describe('pipeline and bottleneck', () => {
  const jobs = [
    job({ id: 'a' }),
    job({ id: 'b' }),
    job({ id: 'c', status: 'in_production' }),
    job({
      id: 'd',
      status: 'completed',
      packaging_status: 'packaged',
      qc_status: 'passed',
      assembly_status: 'completed',
      finishing_status: 'completed',
    }),
    job({ id: 'e', status: 'failed' }),
  ]

  it('counts every job once, in flow order', () => {
    const stages = pipeline(jobs)
    expect(stages.map(s => s.key)).toEqual([
      'to_batch',
      'batched',
      'printing',
      'assembly',
      'finishing',
      'qc',
      'packing',
      'packed',
    ])
    expect(stages.find(s => s.key === 'to_batch')?.count).toBe(2)
    expect(stages.reduce((sum, s) => sum + s.count, 0)).toBe(4)
  })

  it('names the busiest waiting stage, never packed', () => {
    expect(bottleneck(pipeline(jobs))).toBe('to_batch')
    const allPacked = pipeline([jobs[3] as ProductionJob])
    expect(bottleneck(allPacked)).toBeNull()
  })
})

describe('attentionItems', () => {
  it('lists failed jobs before held and flagged ones, with a reason', () => {
    const items = attentionItems([
      job({ id: 'h', held: true }),
      job({ id: 'f', status: 'failed' }),
      job({ id: 's', issue_reason: 'sku_missing' }),
    ])
    expect(items.map(i => i.id)).toEqual(['f', 'h', 's'])
    expect(items[0]?.severity).toBe('danger')
    expect(items[2]?.reason).toBe('SKU missing')
  })
})
