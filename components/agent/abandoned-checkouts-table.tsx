'use client'

import { type JSX, type ReactNode, type SyntheticEvent, useMemo, useState } from 'react'
import type { SortDescriptor } from 'react-aria-components'

import { CallCheckoutButton } from '@/components/agent/call-checkout-button'
import { CheckoutDetailSheet, type DrawerContext } from '@/components/agent/checkout-detail-sheet'
import { CheckoutStatusBadge } from '@/components/agent/checkout-status-badge'
import { FilterBar } from '@/components/production/filter-bar'
import { TablePagination } from '@/components/production/table-pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@/components/ui/aria-table'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { CopyableId } from '@/components/ui/copyable-id'
import { usePagination } from '@/hooks/use-pagination'
import { useTableSort } from '@/hooks/use-table-sort'
import {
  type CheckoutActivity,
  NO_ACTIVITY,
  freshness,
  groupActivity,
  money,
  sinceWhen,
} from '@/lib/checkout-format'
import type { AbandonedCheckout } from '@/lib/validators/abandoned-checkouts'
import type { CallLog } from '@/lib/validators/call-logs'
import type { MessageLog } from '@/lib/validators/message-logs'

type SortKey = 'abandoned' | 'customer' | 'value'

/**
 * The columns, and which of them sort.
 *
 * Only three do, and that is deliberate: a sort control on a column nobody
 * would ever order by (Phone, Items) is noise on every header, and the three
 * here - when, who, how much - are the questions actually asked of this list.
 */
const COLUMNS: { id: string; label: string; sort?: SortKey }[] = [
  { id: 'id', label: 'ID' },
  { id: 'status', label: 'Status' },
  { id: 'recovered', label: 'Recovered' },
  { id: 'abandoned', label: 'Abandoned', sort: 'abandoned' },
  { id: 'customer', label: 'Customer', sort: 'customer' },
  { id: 'phone', label: 'Phone' },
  { id: 'items', label: 'Items' },
  { id: 'value', label: 'Value', sort: 'value' },
  { id: 'agent', label: 'Agent' },
  { id: 'call', label: 'Call' },
  { id: 'actions', label: 'Actions' },
]

/** Ascending comparators; the hook reverses them for descending. */
const COMPARATORS: Record<SortKey, (a: AbandonedCheckout, b: AbandonedCheckout) => number> = {
  // On the timestamp behind "4 hr ago", never the formatted string.
  abandoned: (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
  customer: (a, b) => a.customer_name.localeCompare(b.customer_name),
  // On the number behind "₹1,24,999", which would sort wrongly as text.
  value: (a, b) => Number(a.total_amount) - Number(b.total_amount),
}

type Reachable = 'all' | 'phone' | 'no-phone' | 'recovered'

interface AbandonedCheckoutsTableProps {
  checkouts: AbandonedCheckout[]
  /** Every call and message the agent made; grouped by checkout here. */
  agent: { calls: CallLog[]; messages: MessageLog[] }
  context: DrawerContext
}

function itemSummary(checkout: AbandonedCheckout): string {
  if (checkout.line_items.length === 0) return `${checkout.item_count} item(s)`
  const first = checkout.line_items[0]
  const label = first.variant_title ? `${first.title} · ${first.variant_title}` : first.title
  const rest = checkout.line_items.length - 1
  return rest > 0 ? `${label} +${rest} more` : label
}

/**
 * Built on the React Aria table primitive rather than components/ui/table.tsx.
 *
 * What that buys, and the reason this list was the one to move first: arrow
 * keys walk the grid cell by cell, every cell can take focus, and the column
 * headers are real sort controls announced as such. On a list whose whole
 * purpose is "find the row worth acting on", getting there without a mouse is
 * worth a second primitive.
 */
export function AbandonedCheckoutsTable({
  checkouts,
  agent,
  context,
}: AbandonedCheckoutsTableProps): JSX.Element {
  const [search, setSearch] = useState('')
  const activity = useMemo(() => groupActivity(agent.calls, agent.messages), [agent])
  // The drawer keeps the last checkout while closing, so it slides out whole
  // instead of emptying first.
  const [selected, setSelected] = useState<AbandonedCheckout | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [reachable, setReachable] = useState<Reachable>('all')

  // Split on whether there is a phone number, because that is the only thing
  // that decides whether a row can be acted on at all. A basket with no way to
  // reach the customer is a statistic; one with a number is a task.
  const withPhone = useMemo(() => checkouts.filter(c => c.phone.trim() !== '').length, [checkouts])
  // Carts the customer came back and paid for. They stay in Shopify's list and
  // therefore in ours, which is the point - tracking what happened to a
  // checkout is why the ID column exists - but none of them is a call.
  const recovered = useMemo(
    () => checkouts.filter(c => c.completed_at !== null).length,
    [checkouts],
  )

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return checkouts.filter(checkout => {
      const hasPhone = checkout.phone.trim() !== ''
      if (reachable === 'phone' && !hasPhone) return false
      if (reachable === 'no-phone' && hasPhone) return false
      if (reachable === 'recovered' && checkout.completed_at === null) return false
      if (!needle) return true
      return [
        // The id is searchable as well as visible. Showing a reference nobody
        // can then look up is half a feature.
        checkout.name,
        checkout.customer_name,
        checkout.phone,
        checkout.city,
        checkout.province,
        ...checkout.line_items.map(li => li.sku),
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [checkouts, reachable, search])

  // Sorted BEFORE pagination, or page two would be sorted only within itself.
  // Newest first by default: the freshest basket is the one worth a call.
  const sorted = useTableSort<AbandonedCheckout, SortKey>(filtered, {
    comparators: COMPARATORS,
    initial: { key: 'abandoned', direction: 'desc' },
  })
  const page = usePagination(sorted.rows)

  // The hook stays the source of truth and React Aria renders the indicator
  // from it. React Aria's own model is two-state; the hook's is three, so the
  // direction it proposes is ignored and `toggle` cycles asc -> desc -> off.
  // That third state is what returns the list to newest-first, which is the
  // order it is useful in.
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
          { value: 'all', label: 'All', count: checkouts.length },
          { value: 'phone', label: 'Has phone', count: withPhone },
          { value: 'no-phone', label: 'No phone', count: checkouts.length - withPhone },
          { value: 'recovered', label: 'Recovered', count: recovered },
        ]}
        tabValue={reachable}
        onTabChange={value => setReachable(value as Reachable)}
        tabsLabel="Filter abandoned checkouts by whether the customer left a phone number"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search ID, customer, phone, city or SKU"
      />
      <Card>
        <Table
          aria-label="Abandoned checkouts"
          size="sm"
          sortDescriptor={sortDescriptor}
          onSortChange={descriptor => sorted.toggle(descriptor.column as SortKey)}
          // The whole row opens the checkout's drawer - by click, or Enter on a
          // focused row. The Call and Recover controls keep their own clicks.
          onRowAction={key => {
            const checkout = checkouts.find(c => c.id === key)
            if (!checkout) return
            setSelected(checkout)
            setDrawerOpen(true)
          }}
        >
          <TableHeader>
            {COLUMNS.map(column => (
              <TableColumn
                key={column.id}
                id={column.sort ?? column.id}
                isRowHeader={column.id === 'id'}
                allowsSorting={column.sort !== undefined}
              >
                {column.label}
              </TableColumn>
            ))}
          </TableHeader>

          <TableBody
            items={page.items}
            renderEmptyState={() => (
              <span className="text-muted-foreground text-sm">
                No abandoned checkouts match these filters.
              </span>
            )}
          >
            {checkout => (
              <TableRow id={checkout.id} className="cursor-pointer">
                <TableCell>
                  {/* name, not id: Shopify's `name` is the merchant-facing
                      reference ("#66850843623637"), while `id` is the
                      gid://shopify/AbandonedCheckout/... form - the same
                      number wrapped in noise. */}
                  <CopyableId value={checkout.name} label={`checkout ${checkout.name}`} />
                </TableCell>
                <TableCell>
                  <CheckoutStatusBadge checkout={checkout} />
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">
                    {checkout.completed_at ? sinceWhen(checkout.completed_at) : '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge tone={freshness(checkout.created_at)}>
                    {sinceWhen(checkout.created_at)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-foreground font-medium">
                    {checkout.customer_name || '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-mono tabular-nums">{checkout.phone || '—'}</span>
                </TableCell>
                <TableCell>
                  <span className="block max-w-[13rem] truncate" title={itemSummary(checkout)}>
                    {itemSummary(checkout)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-foreground font-mono font-medium tabular-nums">
                    {money(checkout.total_amount, checkout.currency)}
                  </span>
                </TableCell>
                <TableCell>
                  <AgentSummary activity={activity.get(checkout.id) ?? NO_ACTIVITY} />
                </TableCell>
                <TableCell>
                  {/* Reads the row it sits in - name, number, every product
                      title, the quantity and the total - and hands them to
                      the agent, so what the customer hears always matches
                      what the operator is looking at. */}
                  <OwnClicks>
                    <CallCheckoutButton checkout={checkout} disabled={!context.callingEnabled} />
                  </OwnClicks>
                </TableCell>
                <TableCell>
                  <OwnClicks>
                    <a
                      href={checkout.recovery_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent text-xs underline underline-offset-2"
                    >
                      Recover
                    </a>
                  </OwnClicks>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination page={page} noun="abandoned checkouts" />
      </Card>

      <CheckoutDetailSheet
        checkout={selected}
        open={drawerOpen}
        activity={(selected && activity.get(selected.id)) || NO_ACTIVITY}
        context={context}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}

/** What the agent has done about a row, at a glance; the drawer has the rest. */
function AgentSummary({ activity }: { activity: CheckoutActivity }): JSX.Element {
  const calls = activity.calls.length
  const messages = activity.messages.length
  if (calls === 0 && messages === 0) return <span className="text-muted-foreground">—</span>
  return (
    <span className="text-muted-foreground text-xs whitespace-nowrap">
      {calls > 0 ? `${calls} call${calls === 1 ? '' : 's'}` : null}
      {calls > 0 && messages > 0 ? ' · ' : null}
      {messages > 0 ? `${messages} msg${messages === 1 ? '' : 's'}` : null}
    </span>
  )
}

/**
 * Keeps a control's press from also opening the row's drawer. Pointer and
 * click only: keyboard events still reach the grid, so arrow keys keep
 * walking cell to cell.
 */
function OwnClicks({ children }: { children: ReactNode }): JSX.Element {
  const stop = (event: SyntheticEvent): void => event.stopPropagation()
  return (
    <div onPointerDown={stop} onPointerUp={stop} onClick={stop}>
      {children}
    </div>
  )
}
