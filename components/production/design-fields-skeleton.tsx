import type { JSX } from 'react'

import { Skeleton } from '@/components/ui/skeleton'

/**
 * The Design & fields section while its parts load: the part chips, the design
 * file it prints from, and a few rows of the field mapping.
 */
export function DesignFieldsSkeleton(): JSX.Element {
  return (
    <div className="mt-3 flex flex-col gap-3" aria-busy="true" aria-label="Loading the design">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      <div className="border-border flex flex-col gap-3 rounded-md border p-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-36" />
        {[0, 1, 2].map(row => (
          <div key={row} className="grid grid-cols-[2fr_2fr_1fr] gap-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ))}
      </div>
    </div>
  )
}
