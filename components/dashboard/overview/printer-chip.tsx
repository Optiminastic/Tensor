import type { JSX } from 'react'

import { cn } from '@/lib/utils'

interface PrinterChipProps {
  name: string
  status: string
}

const LABELS: Record<string, string> = {
  busy: 'Printing',
  online: 'Idle',
  maintenance: 'Maintenance',
  offline: 'Offline',
}

/** One printer, as a frosted chip on the sky. The word carries the state; the dot echoes it. */
export function PrinterChip({ name, status }: PrinterChipProps): JSX.Element {
  return (
    <li className="flex items-center gap-2.5 rounded-2xl bg-white/15 px-3.5 py-2.5 ring-1 ring-white/25 backdrop-blur-md">
      <span
        aria-hidden
        className={cn(
          'size-2 rounded-full',
          status === 'busy' && 'bg-landing-lime',
          status === 'online' && 'bg-white',
          status !== 'busy' && status !== 'online' && 'bg-white/40',
        )}
      />
      <span className="text-sm font-medium">{name}</span>
      <span className="font-mono text-[0.6875rem] tracking-wide text-white uppercase">
        {LABELS[status] ?? status}
      </span>
    </li>
  )
}
