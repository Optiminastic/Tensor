import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes, JSX } from 'react'

import { cn } from '@/lib/utils'

/**
 * The table every list in Tensor is built from.
 *
 * MINIMAL BY DEFAULT. No outer border, no vertical rules, no zebra striping -
 * a tinted header band, a hairline under each row, and whitespace. Rules
 * between every cell draw a grid and leave the reader finding the data inside
 * it; a row separator alone is enough to track a line across, which is the
 * only thing the lines are there for.
 *
 * Restyling here reaches every table in the product at once, which is the
 * point: twenty tables that each decide their own padding is how a product
 * stops looking like one product.
 */
export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  /**
   * Tightens every cell so a wide table fits without scrolling sideways.
   *
   * For tables that have earned too many columns to fit comfortably, not as a
   * way to cram more in: a row that is hard to read fast is worse than one you
   * have to scroll to. Set it on the Table and every cell follows - the
   * alternative is each table picking its own padding, which is how a product
   * stops looking like one product.
   */
  dense?: boolean
}

export function Table({ className, dense, ...props }: TableProps): JSX.Element {
  return (
    // The inner shadow is a SCROLL AFFORDANCE, not decoration: several of
    // these tables are fourteen columns wide and scroll sideways with nothing
    // on screen to say so, so a reader simply never finds the columns past the
    // edge. It appears only while there is somewhere to scroll.
    <div className="w-full overflow-x-auto [scrollbar-width:thin]">
      <table
        // A data attribute rather than React context: the cells read it in CSS,
        // so this file stays renderable on the server and no table drags a
        // client boundary along just to be a bit tighter.
        data-density={dense ? 'dense' : undefined}
        className={cn('w-full border-collapse text-sm', className)}
        {...props}
      />
    </div>
  )
}

/**
 * The header band.
 *
 * Tinted rather than ruled: the fill is what separates the labels from the
 * data, so the heavy underline that used to do it is gone.
 */
export function TableHead({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>): JSX.Element {
  return <thead className={cn('bg-surface-muted/60', className)} {...props} />
}

export function TableBody({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>): JSX.Element {
  return <tbody className={cn('divide-border/70 divide-y', className)} {...props} />
}

export function TableRow({
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>): JSX.Element {
  return <tr className={cn('hover:bg-surface-muted/50 transition-colors', className)} {...props} />
}

type SortDirection = 'asc' | 'desc'

export interface TableHeaderCellProps extends ThHTMLAttributes<HTMLTableCellElement> {
  /**
   * Makes the label a sort control. Pass the column's current direction, or
   * null when it is not the sorted one.
   */
  sortDirection?: SortDirection | null
  onSort?: () => void
}

/**
 * A column label, optionally a sort control.
 *
 * Small, uppercase and quiet - the labels are read once to find a column and
 * never again, so they must not compete with the figures underneath.
 *
 * A sortable column shows a FAINT double arrow when it is not the sorted one.
 * Showing nothing until hover is tidier and hides the affordance completely
 * from anyone who does not think to hover - which, on a table, is most people.
 */
export function TableHeaderCell({
  className,
  sortDirection,
  onSort,
  children,
  ...props
}: TableHeaderCellProps): JSX.Element {
  const base = cn(
    'text-subtle-foreground px-4 py-3 text-left text-[11px] font-medium tracking-[0.06em] uppercase',
    '[table[data-density=dense]_&]:px-2.5 [table[data-density=dense]_&]:py-2',
  )

  if (!onSort) {
    return (
      <th className={cn(base, className)} {...props}>
        {children}
      </th>
    )
  }

  const Arrow = sortDirection === 'asc' ? ChevronUp : sortDirection === 'desc' ? ChevronDown : null

  return (
    <th
      // Announces the sort to a screen reader, which the arrow alone does not.
      aria-sort={
        sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : 'none'
      }
      className={cn(base, 'p-0', className)}
      {...props}
    >
      <button
        type="button"
        onClick={onSort}
        className={cn(
          'hover:text-foreground focus-visible:ring-accent/30 flex w-full items-center gap-1 px-4 py-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset',
          '[table[data-density=dense]_&]:px-2.5 [table[data-density=dense]_&]:py-2',
          sortDirection && 'text-foreground',
        )}
      >
        {children}
        {Arrow ? (
          <Arrow className="size-3.5 shrink-0" aria-hidden />
        ) : (
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-40" aria-hidden />
        )}
      </button>
    </th>
  )
}

export function TableCell({
  className,
  numeric,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }): JSX.Element {
  return (
    <td
      className={cn(
        // Taller than the old 16px. Rows this size are what make a dense list
        // scannable without rules between the columns.
        'text-foreground px-4 py-3.5',
        // Dense: set on the Table, applied here, so one prop retightens the
        // whole grid instead of every cell carrying its own override.
        '[table[data-density=dense]_&]:px-2.5 [table[data-density=dense]_&]:py-2 [table[data-density=dense]_&]:text-[0.8125rem]',
        numeric && 'text-right font-mono tabular-nums',
        className,
      )}
      {...props}
    />
  )
}
