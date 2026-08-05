'use client'

import { useState, type JSX } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { Stat } from '@/components/ui/stat'
import { Tabs, type TabItem } from '@/components/ui/tabs'
import type { DesignDetail, DesignMachineSpec, DesignSpecs } from '@/lib/validators/designs'

import { DesignMachineForm } from './design-machine-form'
import { DesignMetricsPanel } from './design-metrics'
import { DesignModelPreview } from './design-model-preview'
import { DesignOrientation } from './design-orientation'
import { DesignOverview } from './design-overview'
import { DesignResubmitForm } from './design-resubmit-form'
import { DesignTimeline } from './design-timeline'
import { DesignVerdict } from './design-verdict'
import { SliceSettingsForm } from './slice-settings-form'

type TabValue = 'overview' | 'preview' | 'pricing' | 'machine' | 'timeline'

const TABS: TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'preview', label: '3D Preview' },
  { value: 'pricing', label: 'Cost & Pricing' },
  { value: 'machine', label: 'Machine' },
  { value: 'timeline', label: 'Timeline' },
]

interface DesignDetailTabsProps {
  brand: string
  design: DesignDetail
  specs: DesignSpecs
  onChanged: () => void
}

/** The four analysis views of a design, switched by the tab bar under the header:
 * the at-a-glance Overview, the interactive 3D Preview, the detailed Cost &
 * Pricing, and the Review thread with the re-slice form. */
export function DesignDetailTabs({
  brand,
  design,
  specs,
  onChanged,
}: DesignDetailTabsProps): JSX.Element {
  const [tab, setTab] = useState<TabValue>('overview')

  return (
    <div className="flex flex-col gap-5">
      <Tabs
        tabs={TABS}
        value={tab}
        onValueChange={value => setTab(value as TabValue)}
        label="Design sections"
      />
      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="flex flex-col gap-6"
      >
        {tab === 'overview' ? (
          <OverviewPanel design={design} onSeePricing={() => setTab('pricing')} />
        ) : null}
        {tab === 'preview' ? (
          <PreviewPanel brand={brand} design={design} specs={specs} onChanged={onChanged} />
        ) : null}
        {tab === 'pricing' ? <PricingPanel design={design} /> : null}
        {tab === 'machine' ? (
          <MachinePanel brand={brand} design={design} onChanged={onChanged} />
        ) : null}
        {tab === 'timeline' ? (
          <TimelinePanel brand={brand} design={design} specs={specs} onChanged={onChanged} />
        ) : null}
      </div>
    </div>
  )
}

interface OverviewPanelProps {
  design: DesignDetail
  onSeePricing: () => void
}

function OverviewPanel({ design, onSeePricing }: OverviewPanelProps): JSX.Element {
  if (!design.metrics && !design.pricing) {
    return <EmptyPanel message="Nothing to show yet - this design has not been costed." />
  }
  return (
    <>
      {design.pricing ? (
        <DesignOverview pricing={design.pricing} onSeePricing={onSeePricing} />
      ) : null}
      {design.metrics ? <DesignMetricsPanel metrics={design.metrics} /> : null}
      {design.metrics?.orientation ? (
        <DesignOrientation orientation={design.metrics.orientation} />
      ) : null}
    </>
  )
}

interface PreviewPanelProps {
  brand: string
  design: DesignDetail
  specs: DesignSpecs
  onChanged: () => void
}

function PreviewPanel({ brand, design, specs, onChanged }: PreviewPanelProps): JSX.Element {
  return (
    <>
      <DesignModelPreview
        designId={design.id}
        orientation={design.metrics?.orientation ?? null}
        refreshKey={design.updated_at}
        hasSlice={Boolean(design.metrics?.gcode_key)}
      />
      <SliceSettingsForm
        brand={brand}
        designId={design.id}
        current={specs}
        onResliced={onChanged}
      />
    </>
  )
}

function PricingPanel({ design }: { design: DesignDetail }): JSX.Element {
  if (!design.pricing) {
    return <EmptyPanel message="No pricing yet - re-slice to cost this design." />
  }
  return <DesignVerdict pricing={design.pricing} />
}

interface MachinePanelProps {
  brand: string
  design: DesignDetail
  onChanged: () => void
}

// The design form's default (0.4mm/standard both sides) whenever a design has
// no machine link yet - matches what a fresh upload would submit.
const DEFAULT_MACHINE_SPEC: DesignMachineSpec = {
  left_nozzle_mm: 0.4,
  right_nozzle_mm: 0.4,
  left_flow: 'standard',
  right_flow: 'standard',
}

function MachinePanel({ brand, design, onChanged }: MachinePanelProps): JSX.Element {
  const machine = design.machine
  const current: DesignMachineSpec = machine
    ? {
        left_nozzle_mm: machine.nozzle_mm as DesignMachineSpec['left_nozzle_mm'],
        right_nozzle_mm: (machine.right_nozzle_mm ??
          machine.nozzle_mm) as DesignMachineSpec['right_nozzle_mm'],
        left_flow: machine.flow as DesignMachineSpec['left_flow'],
        right_flow: (machine.right_flow ?? machine.flow) as DesignMachineSpec['right_flow'],
      }
    : DEFAULT_MACHINE_SPEC

  return (
    <>
      <Card>
        <CardContent>
          {machine ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Family" value={machine.family} />
              <Stat label="Left nozzle" value={`${machine.nozzle_mm.toFixed(1)} mm`} />
              <Stat label="Left flow" value={flowLabel(machine.flow)} />
              <Stat
                label="Right nozzle"
                value={
                  machine.right_nozzle_mm !== null
                    ? `${machine.right_nozzle_mm.toFixed(1)} mm`
                    : '—'
                }
              />
              <Stat
                label="Right flow"
                value={machine.right_flow !== null ? flowLabel(machine.right_flow) : '—'}
              />
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              This design has no machine configuration linked yet.
            </p>
          )}
        </CardContent>
      </Card>
      <DesignMachineForm
        brand={brand}
        designId={design.id}
        current={current}
        onChanged={onChanged}
      />
    </>
  )
}

function flowLabel(flow: string): string {
  return flow === 'high_flow' ? 'High Flow' : 'Standard'
}

interface TimelinePanelProps {
  brand: string
  design: DesignDetail
  specs: DesignSpecs
  onChanged: () => void
}

function TimelinePanel({ brand, design, specs, onChanged }: TimelinePanelProps): JSX.Element {
  return (
    <>
      <DesignTimeline designId={design.id} refreshKey={design.updated_at} />
      <DesignResubmitForm
        brand={brand}
        designId={design.id}
        current={specs}
        onResubmitted={onChanged}
      />
    </>
  )
}

function EmptyPanel({ message }: { message: string }): JSX.Element {
  return (
    <Card>
      <CardContent>
        <p className="text-muted-foreground text-sm">{message}</p>
      </CardContent>
    </Card>
  )
}
