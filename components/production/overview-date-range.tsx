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

/** The period control shared by the Overview, the machine queue board and the
 * production tables: a prev/label/next pill, opening a popover with quick
 * presets, a "jump to week" picker, and an explicit custom from/to range.
 *
 * The steppers only mean something for a week or a month. 'all' has nothing to
 * step, and a custom range's bounds are exactly what the user typed - so both
 * disable them rather than moving a range the user chose deliberately. */
export function OverviewDateRange({ value, onChange }: OverviewDateRangeProps): JSX.Element {
  const now = new Date()
  const label = periodLabel(value, now)
  const steppable = value.unit === 'week' || value.unit === 'month'

  // Both bounds are optional: setting only one gives an open-ended range
  // ("From 3 Mar", "Until 3 Mar"), which is usually what you want when
  // chasing recent records.
  const setBound = (bound: 'from' | 'to', day: string): void =>
    onChange({ ...value, unit: 'custom', anchor: '', [bound]: day })

  return (
    <Popover>
      <div className="border-border bg-surface inline-flex items-center rounded-md border shadow-xs">
        <button
          type="button"
          onClick={() => onChange(stepPeriod(value, now, -1))}
          disabled={!steppable}
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
          disabled={!steppable}
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
        <div className="border-border mt-3 flex flex-col gap-1 border-t pt-3">
          <span className="text-subtle-foreground text-[10px] font-medium tracking-wide uppercase">
            Custom range
          </span>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              aria-label="Range start"
              value={value.unit === 'custom' ? (value.from ?? '') : ''}
              onChange={e => setBound('from', e.target.value)}
              className={cn('flex-1', value.unit !== 'custom' && 'text-muted-foreground')}
            />
            <span className="text-subtle-foreground text-xs">to</span>
            <Input
              type="date"
              aria-label="Range end"
              value={value.unit === 'custom' ? (value.to ?? '') : ''}
              onChange={e => setBound('to', e.target.value)}
              className={cn('flex-1', value.unit !== 'custom' && 'text-muted-foreground')}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
