import Image from 'next/image'
import type { JSX } from 'react'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { AttentionItem } from '@/lib/dashboard/analytics'
import { cn } from '@/lib/utils'

interface AttentionCardProps {
  items: AttentionItem[]
}

const SEVERITY: Record<AttentionItem['severity'], { border: string; pill: string }> = {
  danger: { border: 'border-l-danger', pill: 'bg-danger-subtle text-danger' },
  warning: { border: 'border-l-warning', pill: 'bg-warning-subtle text-warning' },
}

/** The first letter of a title, for the monogram fallback when there is no photo. */
function monogram(title: string): string {
  const first = title.trim().charAt(0)
  return first ? first.toUpperCase() : '#'
}

function AttentionThumb({ item }: { item: AttentionItem }): JSX.Element {
  return (
    <span className="border-border bg-surface-muted relative size-10 shrink-0 overflow-hidden rounded-md border">
      {item.photoFileId ? (
        <Image
          src={`/api/files/${item.photoFileId}`}
          alt=""
          fill
          unoptimized
          sizes="40px"
          className="object-cover"
        />
      ) : (
        <span className="text-subtle-foreground flex h-full items-center justify-center font-mono text-sm">
          {monogram(item.title)}
        </span>
      )}
    </span>
  )
}

function AttentionRow({ item }: { item: AttentionItem }): JSX.Element {
  const severity = SEVERITY[item.severity]
  return (
    <li
      className={cn(
        'border-border flex items-center gap-3 rounded-md border border-l-2 px-3 py-2.5',
        severity.border,
      )}
    >
      <AttentionThumb item={item} />
      <span className="min-w-0 flex-1">
        <span className="text-foreground block truncate text-sm">{item.title}</span>
        <span className="text-muted-foreground font-mono text-xs">{item.jobNumber}</span>
      </span>
      <span
        className={cn(
          'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase',
          severity.pill,
        )}
      >
        {item.reason}
      </span>
    </li>
  )
}

/**
 * Jobs that need a human - held or past due. Each row carries a severity pill and a
 * matching left accent; the reason is spelled out, so severity never rides on colour
 * alone. An empty list is the good state.
 */
export function AttentionCard({ items }: AttentionCardProps): JSX.Element {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Needs attention</CardTitle>
        <CardDescription>Held or overdue production jobs.</CardDescription>
      </CardHeader>
      <div className="flex-1 px-5 py-5">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">All clear - nothing held or overdue.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {items.map(item => (
              <AttentionRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
