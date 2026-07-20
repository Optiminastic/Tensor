'use client'

import { useState, type JSX } from 'react'

import { Eyebrow } from '@/components/landing/eyebrow'
import { Frame } from '@/components/landing/frame'
import { PipelineFigure } from '@/components/landing/pipeline-figure'
import { PipelineStepItem, type PipelineStep } from '@/components/landing/pipeline-step'

/**
 * One design, carried end to end. Every figure below is the engine's real
 * output for this part: CP ₹219.95 prices to ₹999, which the status endpoint
 * calls Yellow because 2.50h of machine time overruns the 2h target, and which
 * the stress test fails at 40% ad spend. It is shown failing on purpose — the
 * pipeline earns its keep by surfacing that before the SKU ships, not after.
 */
const STEPS: PipelineStep[] = [
  {
    id: 'upload',
    n: '01',
    label: 'Upload',
    body: 'A Designer submits an STL, 3MF or STEP with its material, colours and finish. Nothing about the cost is estimated here — it is measured downstream.',
    caption: 'Submission',
    rows: [
      { label: 'File', value: 'shade-v4.3mf' },
      { label: 'Material', value: 'PLA' },
      { label: 'Colours', value: '3' },
      { label: 'Units / bed', value: '4' },
    ],
  },
  {
    id: 'cost',
    n: '02',
    label: 'Cost',
    body: 'The slicer returns print time, filament, purge and support. Those become the true Design CP, with a failure provision carried on top.',
    caption: 'Design CP',
    rows: [
      { label: 'Machine · 2.5h', value: '₹112.50' },
      { label: 'Filament · 45g', value: '₹45.00' },
      { label: 'Purge · 5g', value: '₹5.00' },
      { label: 'Failure provision', value: '₹12.45' },
      { label: 'Design CP', value: '₹219.95', total: true },
    ],
  },
  {
    id: 'pre-check',
    n: '03',
    label: 'Pre-check',
    body: 'A Green / Yellow / Red report with concrete improvements. This design is Yellow: the economics clear, but 2.50h of machine time overruns the 2h target for its rung.',
    caption: 'Pre-check',
    rows: [
      { label: 'CP % of SP', value: '22.02% · pass', tone: 'success' },
      { label: 'Machine / unit', value: '2.50h · over 2h', tone: 'warning' },
      { label: 'Purge waste', value: '5g' },
      { label: 'Status', value: 'Yellow', tone: 'warning', total: true },
    ],
  },
  {
    id: 'price',
    n: '04',
    label: 'Price',
    body: 'Reverse unit economics work back from the margin the brand needs, then snap up to the nearest approved rung. A 40% ad-spend stress test says whether it still survives.',
    caption: 'Selling price',
    rows: [
      { label: 'Raw price', value: '₹948.59' },
      { label: 'Stress test · 40% ads', value: 'Fails', tone: 'warning' },
      { label: 'CP % at rung', value: '22.02%', tone: 'success' },
      { label: 'Snapped to rung', value: '₹999', tone: 'accent', total: true },
    ],
  },
  {
    id: 'approve',
    n: '05',
    label: 'Approve',
    body: 'The Project Lead takes the call and the SKU goes to Shopify. Nothing ships on a price that did not come off the ladder.',
    caption: 'Approval',
    rows: [
      { label: 'Brand', value: 'Gifting' },
      { label: 'Selling price', value: '₹999' },
      { label: 'Decision', value: 'Project Lead' },
      { label: 'Destination', value: 'Shopify', total: true },
    ],
  },
]

export function Pipeline(): JSX.Element {
  const [activeId, setActiveId] = useState<string>(STEPS[0].id)
  const active = STEPS.find(step => step.id === activeId) ?? STEPS[0]

  return (
    <section id="pipeline" className="border-border scroll-mt-16 border-t">
      <Frame marked>
        <div className="grid md:grid-cols-2">
          <div className="border-border md:border-r">
            <div className="px-5 pt-6 pb-2">
              <Eyebrow>Pipeline</Eyebrow>
            </div>
            <ul className="[&>li:last-child]:border-b-0">
              {STEPS.map(step => (
                <PipelineStepItem
                  key={step.id}
                  step={step}
                  active={step.id === active.id}
                  onSelect={() => setActiveId(step.id)}
                />
              ))}
            </ul>
          </div>

          <div
            id="pipeline-readout"
            className="bg-surface-muted flex items-center justify-center p-6 sm:p-10"
          >
            <PipelineFigure
              key={active.id}
              caption={active.caption}
              rows={active.rows}
              className="w-full max-w-sm"
            />
          </div>
        </div>
      </Frame>
    </section>
  )
}
