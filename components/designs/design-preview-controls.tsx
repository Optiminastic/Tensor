'use client'

import { useState, type JSX, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/ui/status-pill'
import { cn } from '@/lib/utils'
import type { DesignOptimization, PersonalisationEstimate } from '@/lib/validators/designs'

import { CutControls, type CutControlsState } from './cut-controls'
import type { OrientationMeasure, RotateAxis } from './model-viewer'

const MAX_NAME_LENGTH = 24
const NUDGE_MM = 2

type SidebarTab = 'personalize' | 'optimize'

interface PreviewControlsProps {
  onRotate: (axis: RotateAxis) => void
  onReset: () => void
  cut: CutControlsState
  measure: OrientationMeasure | null
  nameText: string
  onNameChange: (value: string) => void
  onApply: () => void
  nameSize: number
  onSizeChange: (value: number) => void
  onNudge: (dx: number, dy: number) => void
  onCenter: () => void
  estimate: PersonalisationEstimate | null
  onOptimize: () => void
  optimization: DesignOptimization | null
  optimizeLoading: boolean
  optimizeError: string | null
}

/**
 * The detailed-view sidebar, split into two tabs: Personalization (add a name as
 * real embossed geometry) and Optimizations (orient the model to cut supports;
 * AI-driven design suggestions land here next).
 */
export function PreviewControls(props: PreviewControlsProps): JSX.Element {
  const [tab, setTab] = useState<SidebarTab>('personalize')

  return (
    <div className="flex flex-col gap-4">
      <div className="border-border flex rounded-md border p-0.5" role="tablist">
        <TabButton active={tab === 'personalize'} onClick={() => setTab('personalize')}>
          Personalization
        </TabButton>
        <TabButton active={tab === 'optimize'} onClick={() => setTab('optimize')}>
          Optimizations
        </TabButton>
      </div>

      {tab === 'personalize' ? <PersonalizeTab {...props} /> : <OptimizeTab {...props} />}
    </div>
  )
}

function PersonalizeTab({
  nameText,
  onNameChange,
  onApply,
  nameSize,
  onSizeChange,
  onNudge,
  onCenter,
  estimate,
}: PreviewControlsProps): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <input
          value={nameText}
          onChange={e => onNameChange(e.target.value.slice(0, MAX_NAME_LENGTH))}
          onKeyDown={e => {
            if (e.key === 'Enter') onApply()
          }}
          placeholder="Type a name"
          aria-label="Personalisation name"
          className="border-border bg-surface text-foreground focus-visible:ring-ring w-full rounded-md border px-2.5 py-1.5 text-sm focus-visible:ring-2 focus-visible:outline-none"
        />
        <Button size="sm" onClick={onApply}>
          Apply
        </Button>
      </div>
      <label className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">Size</span>
        <input
          type="range"
          min={3}
          max={40}
          step={1}
          value={nameSize}
          onChange={e => onSizeChange(Number(e.target.value))}
          aria-label="Text size"
          className="flex-1"
        />
        <span className="font-mono tabular-nums">{nameSize}mm</span>
      </label>
      <div className="flex flex-wrap items-center gap-1">
        <span className="text-muted-foreground text-xs">Move</span>
        <PadButton onClick={() => onNudge(-NUDGE_MM, 0)} label="Move left">
          ←
        </PadButton>
        <PadButton onClick={() => onNudge(NUDGE_MM, 0)} label="Move right">
          →
        </PadButton>
        <PadButton onClick={() => onNudge(0, NUDGE_MM)} label="Move up">
          ↑
        </PadButton>
        <PadButton onClick={() => onNudge(0, -NUDGE_MM)} label="Move down">
          ↓
        </PadButton>
        <PadButton onClick={onCenter}>Center</PadButton>
      </div>
      {estimate ? (
        <p className="text-muted-foreground font-mono text-xs tabular-nums">
          +{estimate.added_grams}g · +{estimate.added_time_minutes}min · +₹
          {estimate.added_design_cp} <span className="text-subtle-foreground">est.</span>
        </p>
      ) : null}
      <p className="text-subtle-foreground text-xs">
        The name is embossed as real, printable geometry. Adjust the size and position, then Apply
        to regenerate.
      </p>
    </div>
  )
}

function OptimizeTab({
  onRotate,
  onReset,
  cut,
  measure,
  onOptimize,
  optimization,
  optimizeLoading,
  optimizeError,
}: PreviewControlsProps): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <Button size="sm" onClick={onOptimize} disabled={optimizeLoading}>
          {optimizeLoading
            ? 'Analyzing…'
            : optimization
              ? 'Re-run AI optimization'
              : 'Run AI optimization'}
        </Button>
        {optimizeError ? (
          <p role="alert" className="text-danger text-xs">
            {optimizeError}
          </p>
        ) : null}
        {optimization ? (
          <OptimizationReport data={optimization} />
        ) : (
          <p className="text-subtle-foreground text-xs">
            Nozzle-aware AI advice on filament, support, orientation, and cost for this design.
          </p>
        )}
      </div>

      <div className="border-border flex flex-col gap-3 border-t pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-xs">Rotate 90°</span>
          <PadButton onClick={() => onRotate('x')}>X</PadButton>
          <PadButton onClick={() => onRotate('y')}>Y</PadButton>
          <PadButton onClick={() => onRotate('z')}>Z</PadButton>
          <PadButton onClick={onReset}>Reset</PadButton>
        </div>
        <CutControls {...cut} />
        {measure ? (
          <div className="flex flex-col gap-1 font-mono text-xs tabular-nums">
            <span className="text-foreground flex items-center gap-1.5">
              <span className="bg-warning inline-block size-2.5 rounded-sm" aria-hidden />
              Overhang {Math.round(measure.overhang)} mm²
            </span>
            <span className="text-muted-foreground">
              Bed contact {Math.round(measure.contact)} mm²
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

const VERDICT_LABEL: Record<DesignOptimization['verdict'], string> = {
  green: 'Good to print',
  yellow: 'Improvable',
  red: 'Needs work',
}

function OptimizationReport({ data }: { data: DesignOptimization }): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <StatusPill status={data.verdict} label={VERDICT_LABEL[data.verdict]} />
      <p className="text-muted-foreground text-xs">{data.summary}</p>
      <ReportRow
        label="Filament"
        value={data.filament.recommended_preset || data.filament.material}
        note={data.filament.rationale}
      />
      <ReportRow
        label="Support"
        value={data.support.needed ? data.support.strategy || 'Needed' : 'Not needed'}
        note={data.support.rationale}
      />
      {data.recommendations.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-foreground text-xs font-medium">Recommendations</span>
          <ul className="flex flex-col gap-2">
            {data.recommendations.map((r, i) => (
              <li key={`${r.category}-${i}`} className="border-border rounded-md border p-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-foreground text-xs font-medium">{r.title}</span>
                  <span className="text-subtle-foreground text-xs tracking-wide uppercase">
                    {r.category}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">{r.detail}</p>
                {r.impact ? (
                  <p className="text-foreground mt-1 font-mono text-xs tabular-nums">{r.impact}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

interface ReportRowProps {
  label: string
  value: string
  note?: string
}

function ReportRow({ label, value, note }: ReportRowProps): JSX.Element {
  return (
    <div className="flex flex-col gap-0.5 text-xs">
      <div className="flex items-baseline gap-2">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-medium">{value}</span>
      </div>
      {note ? <p className="text-subtle-foreground">{note}</p> : null}
    </div>
  )
}

interface TabButtonProps {
  active: boolean
  onClick: () => void
  children: ReactNode
}

function TabButton({ active, onClick, children }: TabButtonProps): JSX.Element {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'flex-1 rounded px-3 py-1 text-xs font-medium transition-colors',
        active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

interface PadButtonProps {
  onClick: () => void
  children: ReactNode
  label?: string
}

function PadButton({ onClick, children, label }: PadButtonProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'border-border text-foreground hover:bg-surface-muted rounded-md border px-2.5 py-1',
        'text-xs font-medium transition-colors',
      )}
    >
      {children}
    </button>
  )
}
