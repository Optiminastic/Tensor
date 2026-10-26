'use client'

import { useQuery } from '@tanstack/react-query'
import { type JSX } from 'react'

import { listDamageReportsAction } from '@/app/dashboard/[brand]/agent/damaged-products/actions'
import { DamagedProductsTable } from '@/components/agent/damaged-products-table'
import type { DamageReports } from '@/lib/validators/whatsapp-damage'

interface DamagedProductsProps {
  brand: string
  initial: DamageReports
  canResolve: boolean
}

/**
 * Polled, and more slowly than the inbox.
 *
 * The inbox is a live conversation and refreshes every ten seconds; this is a
 * worklist. But it does have to move on its own: a report's photographs arrive
 * after the report does, so a page that never refetched would show "0 of 3
 * received" until somebody reloaded it, which reads as a report with no
 * evidence rather than one whose evidence is still coming.
 */
const POLL_MS = 30_000

export function DamagedProducts({ brand, initial, canResolve }: DamagedProductsProps): JSX.Element {
  const { data, refetch } = useQuery({
    queryKey: ['damage-reports', brand],
    queryFn: async () => {
      const result = await listDamageReportsAction(brand)
      if (!result.ok || !result.data) throw new Error(result.error ?? 'Could not load reports.')
      return result.data
    },
    initialData: initial,
    refetchInterval: POLL_MS,
  })

  return (
    <DamagedProductsTable
      brand={brand}
      reports={data.items}
      counts={data.counts}
      canResolve={canResolve}
      onChanged={() => void refetch()}
    />
  )
}
