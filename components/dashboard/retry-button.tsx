'use client'

import { useRouter } from 'next/navigation'
import type { JSX } from 'react'

import { Button } from '@/components/ui/button'

/**
 * Re-runs the current route's server components (router.refresh) so a page that
 * failed because the backend was momentarily unreachable can recover in place,
 * without a full reload, once the service is back.
 */
export function RetryButton(): JSX.Element {
  const router = useRouter()
  return (
    <Button variant="primary" size="sm" onClick={() => router.refresh()}>
      Try again
    </Button>
  )
}
