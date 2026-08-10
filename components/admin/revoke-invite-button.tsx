'use client'

import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { revokeInviteAction } from '@/app/admin/actions'
import { Button } from '@/components/ui/button'

interface RevokeInviteButtonProps {
  inviteId: string
}

/**
 * Revokes a pending invitation so its one-time link can no longer be redeemed.
 * A re-invite supersedes it anyway; this is the explicit cancel.
 */
export function RevokeInviteButton({ inviteId }: RevokeInviteButtonProps): JSX.Element {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function revoke(): Promise<void> {
    setBusy(true)
    setError(null)
    const result = await revokeInviteAction(inviteId)
    setBusy(false)
    if (!result.ok) {
      setError(result.error ?? 'Could not revoke.')
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={revoke}
        disabled={busy}
        className="text-danger hover:text-danger"
      >
        {busy ? 'Revoking…' : 'Revoke'}
      </Button>
      {error ? <span className="text-danger text-xs">{error}</span> : null}
    </div>
  )
}
