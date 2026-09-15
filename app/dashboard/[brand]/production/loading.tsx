import type { JSX } from 'react'

import { Card } from '@/components/ui/card'

/**
 * What Production shows while a page is being built on the server.
 *
 * Without a loading.tsx a route segment has no Suspense boundary, so Next has
 * nothing to stream and the browser simply holds the previous page - frozen,
 * unresponsive, with no acknowledgement that the click landed. Several seconds
 * of that reads as a hang rather than a load, which is how a slow page becomes
 * a broken-feeling one.
 *
 * Deliberately a shape, not a spinner: matching the header-then-table rhythm of
 * every page under Production means the layout does not jump when the real
 * content replaces it.
 *
 * aria-busy and the screen-reader line rather than animated bars alone, because
 * "wait" is information a screen reader needs too.
 */
export default function ProductionLoading(): JSX.Element {
  return (
    <main aria-busy="true" className="flex w-full animate-pulse flex-col gap-8 px-6 py-10 md:px-8">
      <span className="sr-only" role="status">
        Loading
      </span>

      {/* Page title and its description. */}
      <div className="flex flex-col gap-2">
        <div className="bg-surface-muted h-8 w-48 rounded-md" />
        <div className="bg-surface-muted h-4 w-72 rounded-md" />
      </div>

      {/* The tab strip. */}
      <div className="flex gap-2">
        {[64, 88, 72, 56].map(width => (
          <div key={width} className="bg-surface-muted h-8 rounded-md" style={{ width }} />
        ))}
      </div>

      <Card className="flex flex-col gap-3 p-4">
        {/* Eight rows: enough to fill the fold without pretending to know how
            many the page will actually have. */}
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="border-border flex items-center gap-4 border-b pb-3 last:border-0"
          >
            <div className="bg-surface-muted h-4 w-28 rounded" />
            <div className="bg-surface-muted h-4 flex-1 rounded" />
            <div className="bg-surface-muted h-4 w-20 rounded" />
            <div className="bg-surface-muted h-4 w-16 rounded" />
          </div>
        ))}
      </Card>
    </main>
  )
}
