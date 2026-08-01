'use client'

import { Trash2 } from 'lucide-react'
import { useState, type JSX } from 'react'

import { deleteBrand } from '@/app/dashboard/brands/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { BrandProfile } from '@/lib/validators/brands'

interface BrandDeleteRowProps {
  brand: BrandProfile
  onDeleted: (slug: string) => void
}

/**
 * One brand in the Settings delete list: its name and slug, plus a Delete button
 * that opens a confirmation dialog. Deleting cascades to the brand's designs,
 * pricing and connections, so the destructive action is always confirmed first.
 * Authorization (`brand:manage`) is enforced by Tensor-Core, not here.
 */
export function BrandDeleteRow({ brand, onDeleted }: BrandDeleteRowProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onConfirm(): Promise<void> {
    setError(null)
    setDeleting(true)
    try {
      const result = await deleteBrand(brand.slug)
      if (!result.ok) {
        setError(result.error ?? 'Could not delete the brand.')
        return
      }
      setOpen(false)
      onDeleted(brand.slug)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <li className="border-border flex items-center justify-between gap-4 rounded-md border px-4 py-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-foreground text-sm font-medium">{brand.name}</span>
        <span className="text-subtle-foreground font-mono text-xs">{brand.slug}</span>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary" size="sm">
            <Trash2 aria-hidden className="size-4" />
            Delete
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {brand.name}?</DialogTitle>
            <DialogDescription>
              This removes {brand.name} and all its designs, pricing and connections. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {error ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="ghost" size="sm" disabled={deleting}>
                Cancel
              </Button>
            </DialogClose>
            <Button variant="danger" size="sm" onClick={onConfirm} disabled={deleting}>
              {deleting ? 'Deleting…' : `Delete ${brand.name}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </li>
  )
}
