'use client'

import { Archive, ArchiveRestore } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import {
  archiveDesignForBrand,
  unarchiveDesignForBrand,
} from '@/app/dashboard/[brand]/designs/archive-actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface ArchiveDesignButtonProps {
  brand: string
  designId: string
  name: string
  archived: boolean
}

/**
 * Soft-deletes a design (Archive) or brings it back (Restore). Archiving hides
 * the design from every list but "Archived" and is reversible, so it asks for a
 * light confirmation; restoring is safe and immediate. Guarded by design:delete.
 */
export function ArchiveDesignButton({
  brand,
  designId,
  name,
  archived,
}: ArchiveDesignButtonProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(archiveIt: boolean): Promise<void> {
    setBusy(true)
    setError(null)
    const result = archiveIt
      ? await archiveDesignForBrand(brand, designId)
      : await unarchiveDesignForBrand(brand, designId)
    setBusy(false)
    if (!result.ok) {
      setError(result.error ?? 'Could not update this design.')
      return
    }
    setOpen(false)
    router.refresh()
  }

  if (archived) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          onClick={() => void run(false)}
          disabled={busy}
        >
          <ArchiveRestore className="size-4" aria-hidden />
          {busy ? 'Restoring…' : 'Restore design'}
        </Button>
        {error ? <span className="text-danger text-sm">{error}</span> : null}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="self-start">
          <Archive className="size-4" aria-hidden />
          Archive
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Archive &ldquo;{name}&rdquo;?</DialogTitle>
          <DialogDescription>
            The design is hidden from every list except Archived. It is not deleted - you can
            restore it any time. A product already published to Shopify is unaffected.
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
          <Button onClick={() => void run(true)} disabled={busy}>
            {busy ? 'Archiving…' : 'Archive design'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
