'use client'

import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { autoCreateBatches } from '@/app/dashboard/[brand]/production/actions'
import { Button } from '@/components/ui/button'

interface AutoCreateBatchesButtonProps {
  brand: string
}

/** Runs the Batch Optimizer on demand. The background worker already does
 * this on a debounced trigger whenever jobs become batchable; this is for an
 * operator who wants it right now instead of waiting. */
export function AutoCreateBatchesButton({ brand }: AutoCreateBatchesButtonProps): JSX.Element {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(): Promise<void> {
    setPending(true)
    setError(null)
    const res = await autoCreateBatches(brand)
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not create batches.')
      return
    }
    // Open the first batch forged so the operator can review the full detail
    // (and the products placed on it) immediately.
    const created = res.data?.created ?? []
    if (created.length > 0) {
      router.push(`/dashboard/${brand}/production/batches/${created[0].id}`)
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button variant="secondary" size="sm" disabled={pending} onClick={() => void run()}>
        {pending ? 'Planning…' : 'Auto-create batches'}
      </Button>
      {error ? (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      ) : null}
    </div>
  )
}
