'use client'

import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import type { JSX } from 'react'

import {
  periodLabel,
  stepPeriod,
  type PeriodUnit,
  type PeriodValue,
} from '@/components/production/date-range'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface OverviewDateRangeProps {
  value: PeriodValue
  onChange: (value: PeriodValue) => void
}

interface Preset {
  label: string
  unit: PeriodUnit
  anchor: (now: Date) => string
}

const PRESETS: Preset[] = [
  { label: 'This week', unit: 'week', anchor: now => now.toISOString().slice(0, 10) },
  {
    label: 'Last week',
    unit: 'week',
    anchor: now => new Date(now.getTime() - 7 * 86_400_000).toISOString().slice(0, 10),
  },
  { label: 'This month', unit: 'month', anchor: now => now.toISOString().slice(0, 10) },
  { label: 'All time', unit: 'all', anchor: () => '' },
]

/** The period control shared by the Overview and the machine queue board: a
 * prev/label/next pill (matching the reference), opening a popover with
 * quick presets and a "jump to week" date picker. */
export function OverviewDateRange({ value, onChange }: OverviewDateRangeProps): JSX.Element {
  const now = new Date()
  const label = periodLabel(value, now)

  return (
    <Popover>
      <div className="border-border bg-surface inline-flex items-center rounded-md border shadow-xs">
        <button
          type="button"
          onClick={() => onChange(stepPeriod(value, now, -1))}
          disabled={value.unit === 'all'}
          aria-label="Previous period"
          className="text-muted-foreground hover:text-foreground hover:bg-surface-muted flex h-9 w-8 items-center justify-center rounded-l-md disabled:opacity-40"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="text-foreground hover:bg-surface-muted flex h-9 items-center gap-1.5 px-2 text-sm font-medium"
          >
            <CalendarDays className="size-3.5" aria-hidden />
            {label}
          </button>
        </PopoverTrigger>
        <button
          type="button"
          onClick={() => onChange(stepPeriod(value, now, 1))}
          disabled={value.unit === 'all'}
          aria-label="Next period"
          className="text-muted-foreground hover:text-foreground hover:bg-surface-muted flex h-9 w-8 items-center justify-center rounded-r-md disabled:opacity-40"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
      <PopoverContent align="start" className="w-72">
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map(preset => (
            <Button
              key={preset.label}
              type="button"
              variant={preset.label === label ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => onChange({ unit: preset.unit, anchor: preset.anchor(now) })}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <div className="mt-3 flex flex-col gap-1">
          <span className="text-subtle-foreground text-[10px] font-medium tracking-wide uppercase">
            Jump to week
          </span>
          <Input
            type="date"
            value={value.unit === 'week' ? value.anchor : ''}
            onChange={e => onChange({ unit: 'week', anchor: e.target.value })}
            className={cn(value.unit !== 'week' && 'text-muted-foreground')}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
