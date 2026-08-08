'use client'

import type { JSX } from 'react'

import { type DateRangePreset, type DateRangeValue } from '@/components/production/date-range'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

interface OverviewDateRangeProps {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
}

const PRESET_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom range' },
]

/** The Overview's top-right date filter: a preset select, plus a from/to date
 * pair that only appears for 'custom'. Every stat and table on the page reads
 * from this one control. */
export function OverviewDateRange({ value, onChange }: OverviewDateRangeProps): JSX.Element {
  return (
    <div className="flex flex-nowrap items-center gap-2">
      <Select
        aria-label="Date range"
        value={value.preset}
        onChange={e => onChange({ ...value, preset: e.target.value as DateRangePreset })}
        className="w-40 shrink-0"
      >
        {PRESET_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      {value.preset === 'custom' ? (
        <>
          <Input
            type="date"
            aria-label="From date"
            value={value.from}
            onChange={e => onChange({ ...value, from: e.target.value })}
            className="w-36 shrink-0"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            aria-label="To date"
            value={value.to}
            onChange={e => onChange({ ...value, to: e.target.value })}
            className="w-36 shrink-0"
          />
        </>
      ) : null}
    </div>
  )
}
