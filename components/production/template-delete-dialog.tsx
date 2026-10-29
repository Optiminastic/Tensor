'use client'

import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { deleteDesignTemplateAction } from '@/app/dashboard/[brand]/production/design-template-actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { DesignTemplate } from '@/lib/validators/registry'

interface TemplateDeleteDialogProps {
  brand: string
  template: DesignTemplate
}

/**
 * Removes an uploaded design file from the registry.
 *
 * THE BACKEND DECIDES WHETHER IT MAY GO. A template key is referenced as TEXT
 * rather than by a foreign key - deliberately, because a variant may be
 * pointed at a file before the file exists - so nothing in the database stops
 * the last file a product renders from disappearing. The refusal names the
 * products that would be left with nothing to print, and that sentence is
 * shown here as it arrives rather than being guessed at from what this screen
 * happens to know.
 *
 * It is a RETIREMENT, not an erasure, and the wording says so: the file that
 * printed real orders stays reachable, because "which file made the thing this
 * customer is holding" has to stay answerable after a tidy-up.
 */
export function TemplateDeleteDialog({ brand, template }: TemplateDeleteDialogProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const usedBy = template.used_by ?? []

  async function remove(): Promise<void> {
    setBusy(true)
    setError(null)
    const res = await deleteDesignTemplateAction(brand, template.key)
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not remove the design file.')
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        setOpen(next)
        if (next) setError(null)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Remove ${template.key}`}>
          <Trash2 className="size-3.5" aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove {template.key}?</DialogTitle>
          <DialogDescription>
            It leaves the registry. Earlier versions stay in its history, so what printed past
            orders is still answerable.
          </DialogDescription>
        </DialogHeader>

        {usedBy.length > 0 ? (
          // Said before the attempt as well as after it. The backend refuses
          // either way, but a dialog that lets somebody press a button that
          // cannot work is a dialog that taught them to ignore it.
          <p className="bg-warning-subtle text-warning rounded-2xl px-4 py-3 text-sm text-pretty">
            {usedBy.map(u => u.product_code).join(', ')} still{' '}
            {usedBy.length === 1 ? 'renders' : 'render'} from this file. Point{' '}
            {usedBy.length === 1 ? 'it' : 'them'} at another file first — this will be refused until
            then.
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => void remove()} disabled={busy}>
            {busy ? 'Removing…' : 'Remove'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
