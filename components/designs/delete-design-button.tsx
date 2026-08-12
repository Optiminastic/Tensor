'use client'

import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { deleteDesignAction } from '@/app/dashboard/[brand]/designs/delete-actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface DeleteDesignButtonProps {
  brand: string
  designId: string
  name: string
  // 'overlay' floats a round icon button (grid cards); 'inline' is a text button
  // for the table rows.
  variant?: 'overlay' | 'inline'
  // Where to go after a successful delete. Required on the design detail page,
  // where staying put would re-render the now-deleted design and 404. Omit on a
  // list (the row just disappears on refresh).
  redirectTo?: string
}

/**
 * Deletes a design after confirmation. Removal is permanent and cascades to the
 * design's slice jobs, metrics, pricing and reviews. It does not remove a
 * published product from Shopify. Guarded by design:delete in the backend.
 */
export function DeleteDesignButton({
  brand,
  designId,
  name,
  variant = 'overlay',
  redirectTo,
}: DeleteDesignButtonProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function remove(): Promise<void> {
    setBusy(true)
    setError(null)
    const result = await deleteDesignAction(brand, designId)
    setBusy(false)
    if (!result.ok) {
      setError(result.error ?? 'Could not delete this design.')
      return
    }
    setOpen(false)
    // On the detail page the design is gone, so refreshing in place would 404;
    // leave for the list instead (replace so Back does not return to the dead URL).
    if (redirectTo) {
      router.replace(redirectTo)
      router.refresh()
      return
    }
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === 'overlay' ? (
          <button
            type="button"
            aria-label={`Delete ${name}`}
            className={cn(
              'border-border bg-surface/90 text-muted-foreground hover:text-danger',
              'flex size-7 items-center justify-center rounded-full border shadow-sm backdrop-blur transition-colors',
            )}
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        ) : (
          <Button variant="ghost" size="sm" className="text-danger hover:text-danger">
            Delete
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{name}&rdquo;?</DialogTitle>
          <DialogDescription>
            This permanently removes the design and its slice, cost and review history. It cannot be
            undone, and it does not remove a product already published to Shopify.
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
            {busy ? 'Deleting…' : 'Delete design'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
