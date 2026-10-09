'use client'

import { Search } from 'lucide-react'
import type { JSX } from 'react'

import { Select, SelectItem } from '@/components/base/select/select'
import { Tab, TabList, Tabs } from '@/components/base/tabs/tabs'
import type { PeriodValue } from '@/components/production/date-range'
import { OverviewDateRange } from '@/components/production/overview-date-range'
import { Input } from '@/components/ui/input'
import type { TabItem } from '@/components/ui/tabs'

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
  /** Date filter, pinned to the far right. Both props go together - pass
   * neither on a table with no meaningful date column, so the control never
   * appears without being able to do anything. */
  period?: PeriodValue
  onPeriodChange?: (value: PeriodValue) => void
}

/** The sentinel for "no filter on this column". */
const ALL = '__all__'

/**
 * The filter strip above a table: the primary status split as counted tabs,
 * any secondary column dropdowns, and a search box pinned to the right.
 *
 * BUILT ON BOARDUI's Tabs and Select (components/base/*), re-skinned through
 * the token bridge in app/globals.css. Both are React Aria underneath, which
 * is what they are here for: the tab list takes arrow keys and announces its
 * selection, and the select is a real listbox rather than a native <select>
 * that cannot be styled and reads differently on every platform.
 *
 * This one file reaches seven pages, which is why it went first - the strip
 * above a table is the control an operator touches most, and changing it here
 * changes it everywhere rather than seven times.
 *
 * NOTHING SCROLLS SIDEWAYS. The row wraps instead.
 *
 * It used to scroll, and BoardUI's tabs made that visible: its Tabs, its list
 * wrapper and the list itself are all `w-full`, because they are built to span
 * a panel rather than sit inline in a toolbar. Inside a flex-nowrap row that
 * claims the whole width, pushes the search and the date range past the edge,
 * and leaves a scrollbar as the only way to reach them - which is the one
 * place a control must never be, since nobody scrolls a toolbar looking for a
 * button they do not know is there.
 *
 * So the tab group is wrapped in a `w-max` box - `w-full` of a max-content box
 * is the tabs' natural width - and the row wraps to a second line when it
 * genuinely runs out of space.
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
  period,
  onPeriodChange,
}: FilterBarProps): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
      {/*
        overflow-x-auto on THIS box, not on the row.
        w-max means the tabs are their natural width and nothing scrolls at a
        normal viewport. The overflow is for the case that remains - a status
        split with eight tabs on a laptop - where the alternative to a short
        scroll inside the strip is clipping tabs off the end, which hides them
        with no way to reach them at all.
      */}
      <div className="w-max max-w-full shrink-0 overflow-x-auto">
        <Tabs selectedKey={tabValue} onSelectionChange={key => onTabChange(String(key))}>
          <TabList aria-label={tabsLabel}>
            {tabs.map(tab => (
              <Tab key={tab.value} id={tab.value} count={tab.count}>
                {tab.label}
              </Tab>
            ))}
          </TabList>
        </Tabs>
      </div>

      {filters.map(filter => (
        <Select
          key={filter.label}
          aria-label={filter.label}
          size="sm"
          // ALL rather than '': React Aria treats an empty key as "nothing
          // selected" and shows the placeholder, so the "all" row could never
          // be chosen back once a real filter had been.
          selectedKey={filter.value === '' ? ALL : filter.value}
          onSelectionChange={key => filter.onChange(key === ALL ? '' : String(key))}
          className="w-40 shrink-0"
        >
          <SelectItem id={ALL}>{filter.label}: All</SelectItem>
          {filter.options.map(option => (
            <SelectItem key={option.value} id={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </Select>
      ))}

      <div className="relative ml-auto w-56 min-w-40">
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

      {period && onPeriodChange ? (
        <div className="shrink-0">
          <OverviewDateRange value={period} onChange={onPeriodChange} />
        </div>
      ) : null}
    </div>
  )
}
