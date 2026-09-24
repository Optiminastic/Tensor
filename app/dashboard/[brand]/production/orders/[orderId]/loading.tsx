import type { JSX } from 'react'

import { Card } from '@/components/ui/card'

/**
 * What one order shows while it loads.
 *
 * Its own file rather than inheriting Production's list skeleton: a detail page
 * is a header and a few panels, not a table, and a skeleton that lies about the
 * shape coming next is worse than none - the layout jumps the moment the real
 * content lands.
 *
 * This route is the one most often opened from a list, which is exactly when a
 * frozen screen is most confusing: you clicked a row, and until the server
 * answered nothing on screen changed at all.
 */
export default function OrderLoading(): JSX.Element {
  return (
    <main
      aria-busy="true"
      className="flex w-full animate-pulse flex-col gap-6 px-4 py-10 sm:px-6 md:px-8"
    >
      <span className="sr-only" role="status">
        Loading order
      </span>

      {/* Back link, then the order number and its status pills. */}
      <div className="flex flex-col gap-3">
        <div className="bg-surface-muted h-4 w-32 rounded" />
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-surface-muted h-7 w-40 rounded-md" />
          <div className="bg-surface-muted h-5 w-20 rounded-full" />
          <div className="bg-surface-muted h-5 w-24 rounded-full" />
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* The line items, which are what somebody opened the order to read. */}
        <Card className="flex flex-1 flex-col gap-4 p-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="border-border flex flex-col gap-2 border-b pb-4 last:border-0">
              <div className="bg-surface-muted h-4 w-2/3 rounded" />
              <div className="bg-surface-muted h-3 w-1/3 rounded" />
              <div className="bg-surface-muted h-3 w-1/2 rounded" />
            </div>
          ))}
        </Card>

        {/* Customer and payment, which sit alongside on a wide screen. */}
        <div className="flex shrink-0 flex-col gap-4 lg:w-80">
          {[3, 4].map(rows => (
            <Card key={rows} className="flex flex-col gap-2 p-4">
              <div className="bg-surface-muted h-4 w-24 rounded" />
              {Array.from({ length: rows }, (_, i) => (
                <div key={i} className="bg-surface-muted h-3 w-full rounded" />
              ))}
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
