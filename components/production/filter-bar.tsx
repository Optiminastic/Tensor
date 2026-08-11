'use client'

import { Search } from 'lucide-react'
import type { JSX } from 'react'

import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Tabs, type TabItem } from '@/components/ui/tabs'

/** One secondary column-based dropdown filter shown in a FilterBar. */
export interface FilterBarFilter {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}

interface FilterBarProps {
  tabs: TabItem[]
  tabValue: string
  onTabChange: (value: string) => void
  tabsLabel: string
  filters?: FilterBarFilter[]
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
}

/**
 * A standalone filter strip shown above a table (not a section inside the
 * table's card): the primary status split as counted tabs (same Tabs
 * primitive as the QC/Packaging queues), any secondary column dropdowns, and
 * a search box pinned to the right - each its own control with its own
 * border, laid out in a plain row rather than nested inside a shared outer
 * box. Stays one row - filters scroll horizontally on overflow rather than
 * wrapping to a second line.
 */
export function FilterBar({
  tabs,
  tabValue,
  onTabChange,
  tabsLabel,
  filters = [],
  searchValue,
  onSearchChange,
  searchPlaceholder,
}: FilterBarProps): JSX.Element {
  return (
    <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
      <Tabs
        tabs={tabs}
        value={tabValue}
        onValueChange={onTabChange}
        label={tabsLabel}
        className="shrink-0"
      />
      {filters.map(filter => (
        <Select
          key={filter.label}
          value={filter.value}
          onChange={e => filter.onChange(e.target.value)}
          aria-label={filter.label}
          className="w-40 shrink-0"
        >
          <option value="">{filter.label}: All</option>
          {filter.options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      ))}
      <div className="relative ml-auto w-56 shrink-0">
        <Search
          className="text-subtle-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
          aria-hidden
        />
        <Input
          type="search"
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label="Search"
          className="pl-8"
        />
      </div>
    </div>
  )
}
