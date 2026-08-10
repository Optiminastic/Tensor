'use client'

import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { setMemberBrandsAction } from '@/app/admin/actions'
import { type BrandChoice, BrandMultiSelect } from '@/components/admin/brand-multi-select'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface EditMemberBrandsProps {
  userId: string
  label: string
  brands: BrandChoice[]
  current: string[]
}

/**
 * Opens a dialog to change one member's brand access. The selection starts from
 * the member's current brands; saving replaces the whole set via the server
 * action, then refreshes so the list reflects the change. The backend enforces
 * `user:manage` - this UI only gathers the choice.
 */
export function EditMemberBrands({
  userId,
  label,
  brands,
  current,
}: EditMemberBrandsProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>(current)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function onOpenChange(next: boolean): void {
    // Reset to the member's current brands each time the dialog opens, so an
    // abandoned edit never leaks into the next one.
    if (next) {
      setSelected(current)
      setError(null)
    }
    setOpen(next)
  }

  async function save(): Promise<void> {
    setSaving(true)
    setError(null)
    const result = await setMemberBrandsAction(userId, { brand_slugs: selected })
    setSaving(false)
    if (!result.ok) {
      setError(result.error ?? 'Could not update brand access.')
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          Edit brands
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Brand access</DialogTitle>
          <DialogDescription>
            Choose the brands {label} may see and work in. This replaces their current access.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <BrandMultiSelect
            brands={brands}
            selected={selected}
            onChange={setSelected}
            disabled={saving}
          />

          {error ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save access'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
