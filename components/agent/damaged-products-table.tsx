'use client'

import { type JSX, useMemo, useState } from 'react'
import type { SortDescriptor } from 'react-aria-components'

import { DamageDetailSheet } from '@/components/agent/damage-detail-sheet'
import { DamagePhotoState } from '@/components/agent/damage-photo-state'
import { DAMAGE_STATUS_CONFIG } from '@/components/agent/damage-status-config'
import { displayNumber, messageTime } from '@/components/agent/whatsapp-time'
import { FilterBar } from '@/components/production/filter-bar'
import { TablePagination } from '@/components/production/table-pagination'
import { TonePill } from '@/components/production/tone-pill'
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/ui/aria-table'
import { Card } from '@/components/ui/card'
import { usePagination } from '@/hooks/use-pagination'
import { useTableSort } from '@/hooks/use-table-sort'
import type { DamageReport, DamageStatus } from '@/lib/validators/whatsapp-damage'

type SortKey = 'reported' | 'customer' | 'order'

/**
 * The columns, and which of them sort.
 *
 * Three do. The rest are either already grouped by the tabs (status) or are
 * read rather than ordered by (the number, the photo state).
 */
const COLUMNS: { id: string; label: string; sort?: SortKey }[] = [
  { id: 'order', label: 'Order', sort: 'order' },
  { id: 'customer', label: 'Customer', sort: 'customer' },
  { id: 'phone', label: 'Number' },
  { id: 'reported', label: 'Reported', sort: 'reported' },
  { id: 'photos', label: 'Attached' },
  { id: 'status', label: 'Status' },
]

/** Ascending comparators; the hook reverses them for descending. */
const COMPARATORS: Record<SortKey, (a: DamageReport, b: DamageReport) => number> = {
  // On the timestamp behind "16 Oct, 2:05 pm", never the formatted string.
  reported: (a, b) => Date.parse(a.reported_at) - Date.parse(b.reported_at),
  customer: (a, b) => a.customer_name.localeCompare(b.customer_name),
  order: (a, b) => a.order_number.localeCompare(b.order_number),
}

/** '' is All, matching the orders table's own convention. */
const TAB_ORDER: DamageStatus[] = ['new', 'in_review', 'resolved']

interface DamagedProductsTableProps {
  brand: string
  reports: DamageReport[]
  counts: Record<string, number>
  canUpdate: boolean
  onChanged: () => void
}

export function DamagedProductsTable({
  brand,
  reports,
  counts,
  canUpdate,
  onChanged,
}: DamagedProductsTableProps): JSX.Element {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('')
  // The drawer keeps the last report while closing, so it slides out whole
  // rather than emptying first.
  const [selected, setSelected] = useState<DamageReport | null>(null)
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return reports.filter(report => {
      if (tab && report.status !== tab) return false
      if (!needle) return true
      return [report.order_number, report.customer_name, report.wa_id]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [reports, tab, search])

  // Sorted BEFORE pagination, or page two would be sorted only within itself.
  // Newest first by default: the report nobody has looked at is the one that
  // matters.
  const sorted = useTableSort<DamageReport, SortKey>(filtered, {
    comparators: COMPARATORS,
    initial: { key: 'reported', direction: 'desc' },
  })
  const page = usePagination(sorted.rows)

  // The hook is the source of truth; React Aria only draws the indicator. Its
  // model is two-state and the hook's is three, so the direction it proposes
  // is ignored and `toggle` cycles asc -> desc -> off.
  const sortDescriptor: SortDescriptor | undefined = sorted.sort
    ? {
        column: sorted.sort.key,
        direction: sorted.sort.direction === 'asc' ? 'ascending' : 'descending',
      }
    : undefined

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        tabs={[
          { value: '', label: 'All', count: counts[''] ?? reports.length },
          ...TAB_ORDER.map(status => ({
            value: status,
            label: DAMAGE_STATUS_CONFIG[status].label,
            count: counts[status] ?? 0,
          })),
        ]}
        tabValue={tab}
        onTabChange={setTab}
        tabsLabel="Filter damage reports by how far they have got"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search order, customer or number"
      />
      <Card>
        <Table
          aria-label="Damaged products"
          size="sm"
          sortDescriptor={sortDescriptor}
          onSortChange={descriptor => sorted.toggle(descriptor.column as SortKey)}
          onRowAction={key => {
            const report = reports.find(r => r.id === key)
            if (!report) return
            setSelected(report)
            setOpen(true)
          }}
        >
          <TableHeader>
            {COLUMNS.map(column => (
              <TableColumn
                key={column.id}
                id={column.sort ?? column.id}
                isRowHeader={column.id === 'order'}
                allowsSorting={column.sort !== undefined}
              >
                {column.label}
              </TableColumn>
            ))}
          </TableHeader>

          <TableBody
            items={page.items}
            renderEmptyState={() => (
              <span className="text-muted-foreground text-sm text-pretty">
                {reports.length === 0
                  ? 'No damage reports yet. One appears here when a customer taps Damage concern on WhatsApp and submits the form it sends them.'
                  : 'No damage reports match these filters.'}
              </span>
            )}
          >
            {report => (
              <TableRow id={report.id} className="cursor-pointer">
                <TableCell>
                  <span className="font-mono text-xs">{report.order_number}</span>
                </TableCell>
                <TableCell>{report.customer_name || '—'}</TableCell>
                <TableCell>
                  <span className="text-muted-foreground font-mono text-xs">
                    {displayNumber(report.wa_id)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground font-mono text-xs tabular-nums">
                    {messageTime(report.reported_at)}
                  </span>
                </TableCell>
                <TableCell>
                  <DamagePhotoState report={report} />
                </TableCell>
                <TableCell>
                  <TonePill
                    label={DAMAGE_STATUS_CONFIG[report.status].label}
                    tone={DAMAGE_STATUS_CONFIG[report.status].tone}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination page={page} noun="damage reports" />
      </Card>

      <DamageDetailSheet
        brand={brand}
        report={selected}
        open={open}
        canUpdate={canUpdate}
        onClose={() => setOpen(false)}
        onChanged={onChanged}
      />
    </div>
  )
}
