import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes, JSX } from 'react'

import { cn } from '@/lib/utils'

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>): JSX.Element {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full border-collapse text-sm', className)} {...props} />
    </div>
  )
}

export function TableHead({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>): JSX.Element {
  return <thead className={cn('border-border border-b', className)} {...props} />
}

export function TableBody({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>): JSX.Element {
  return <tbody className={cn('divide-border divide-y', className)} {...props} />
}

export function TableRow({
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>): JSX.Element {
  return <tr className={cn('hover:bg-surface-muted transition-colors', className)} {...props} />
}

export function TableHeaderCell({
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>): JSX.Element {
  return (
    <th
      className={cn(
        'text-subtle-foreground px-3 py-2.5 text-left text-xs font-medium tracking-wide uppercase',
        className,
      )}
      {...props}
    />
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
        'text-foreground px-3 py-3',
        numeric && 'text-right font-mono tabular-nums',
        className,
      )}
      {...props}
    />
  )
}
