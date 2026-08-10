'use client'

import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { removeMemberAction } from '@/app/admin/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface RemoveMemberButtonProps {
  userId: string
  label: string
}

/**
 * Removes a team member after a confirmation. Removal deletes their roles and
 * brand access (their sign-in account remains, but with no access). The backend
 * refuses to remove the last admin; that error is surfaced here.
 */
export function RemoveMemberButton({ userId, label }: RemoveMemberButtonProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function remove(): Promise<void> {
    setBusy(true)
    setError(null)
    const result = await removeMemberAction(userId)
    setBusy(false)
    if (!result.ok) {
      setError(result.error ?? 'Could not remove this member.')
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-danger hover:text-danger">
          Remove
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Remove {label}?</DialogTitle>
          <DialogDescription>
            They lose all roles and brand access immediately. Their sign-in account is not deleted,
            but they can do nothing until re-invited.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={remove} disabled={busy}>
            {busy ? 'Removing…' : 'Remove member'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
