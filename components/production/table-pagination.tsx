'use client'

import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react'
import type { JSX } from 'react'

import { Select } from '@/components/ui/select'
import { PAGE_SIZES, type Pagination } from '@/hooks/use-pagination'

interface TablePaginationProps<T> {
  page: Pagination<T>
  /**
   * What the rows are, plural and lower case - "orders", "jobs", "batches".
   * Read out as "Showing 1 to 15 of 1,007 orders", which says more than a bare
   * count and costs nothing.
   */
  noun: string
}

/**
 * The footer of a paged table: what you are looking at on the left, how to move
 * on the right.
 *
 * Sits inside the table's Card, against the muted surface, so it reads as part
 * of the table rather than as a control floating beneath it. Figures are mono
 * and tabular - they change as you page, and proportional digits would make the
 * whole line shift under the eye.
 */
export function TablePagination<T>({ page, noun }: TablePaginationProps<T>): JSX.Element | null {
  // One page of rows needs no controls. Hiding the bar entirely is better than
  // showing "Page 1 of 1" beside four dead buttons on every small table in the
  // app.
  if (page.total <= PAGE_SIZES[0] && page.pageCount <= 1) return null

  const first = page.page <= 1
  const last = page.page >= page.pageCount

  return (
    <div className="border-border text-muted-foreground flex flex-wrap items-center justify-between gap-3 border-t px-4 py-2.5 text-sm">
      <p>
        Showing <Figure>{page.from}</Figure> to <Figure>{page.to}</Figure> of{' '}
        <Figure>{page.total}</Figure> {noun}
      </p>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2">
          <span className="whitespace-nowrap">Show</span>
          <Select
            value={String(page.pageSize)}
            onChange={event => page.setPageSize(Number(event.target.value))}
            aria-label={`${noun} per page`}
            className="h-8 w-20 text-[0.8125rem]"
          >
            {PAGE_SIZES.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </label>

        <div className="flex items-center gap-1">
          <PageButton
            label="First page"
            disabled={first}
            onClick={() => page.setPage(1)}
            icon={<ChevronFirst className="size-4" aria-hidden />}
          />
          <PageButton
            label="Previous page"
            disabled={first}
            onClick={() => page.setPage(page.page - 1)}
            icon={<ChevronLeft className="size-4" aria-hidden />}
          />
          <p aria-live="polite" className="text-foreground px-2 whitespace-nowrap">
            Page <Figure>{page.page}</Figure> of <Figure>{page.pageCount}</Figure>
          </p>
          <PageButton
            label="Next page"
            disabled={last}
            onClick={() => page.setPage(page.page + 1)}
            icon={<ChevronRight className="size-4" aria-hidden />}
          />
          <PageButton
            label="Last page"
            disabled={last}
            onClick={() => page.setPage(page.pageCount)}
            icon={<ChevronLast className="size-4" aria-hidden />}
          />
        </div>
      </div>
    </div>
  )
}

/** A figure in the bar: mono and tabular, so paging does not shift the line. */
function Figure({ children }: { children: number }): JSX.Element {
  return <span className="text-foreground font-mono tabular-nums">{children.toLocaleString()}</span>
}

interface PageButtonProps {
  label: string
  disabled: boolean
  onClick: () => void
  icon: JSX.Element
}

/**
 * One step control. A round icon button rather than the Button primitive: four
 * of them sit in a row at the end of a dense line, and the primitive's 36px
 * height and padding would make the footer taller than the rows above it.
 */
function PageButton({ label, disabled, onClick, icon }: PageButtonProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="border-border text-muted-foreground hover:border-border-strong hover:bg-surface-muted hover:text-foreground focus-visible:border-accent focus-visible:ring-accent/30 inline-flex size-8 items-center justify-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
    >
      {icon}
    </button>
  )
}
