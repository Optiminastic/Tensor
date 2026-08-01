'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition, type ChangeEvent } from 'react'

import { setMachineStatus } from '@/app/dashboard/[brand]/production/actions'
import type { MachineLiveStatus } from '@/components/production/types'

interface UseMachineStatus {
  status: MachineLiveStatus
  pending: boolean
  error: string | null
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void
}

/**
 * Drives the "Change status" dropdown shared by the machine list row and the
 * detail panel. The status is optimistic so the badge (which reads it) tracks the
 * select immediately; on a failed PATCH it reverts and exposes the error. A
 * successful save revalidates on the server, so refresh reconciles with the truth.
 */
export function useMachineStatus(
  brand: string,
  machineId: string,
  initial: MachineLiveStatus,
): UseMachineStatus {
  const router = useRouter()
  const [status, setStatus] = useState<MachineLiveStatus>(initial)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onChange(event: ChangeEvent<HTMLSelectElement>): void {
    const next = event.target.value as MachineLiveStatus
    const previous = status
    setStatus(next)
    setError(null)
    startTransition(async () => {
      const result = await setMachineStatus(brand, machineId, next)
      if (result.ok) {
        router.refresh()
        return
      }
      setStatus(previous)
      setError(result.error ?? 'Could not update the machine status.')
    })
  }

  return { status, pending, error, onChange }
}
