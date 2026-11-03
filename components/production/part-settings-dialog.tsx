'use client'

import { Settings2, Trash2 } from 'lucide-react'
import { useEffect, useState, type JSX } from 'react'

import { removePart, savePart } from '@/app/dashboard/[brand]/production/design-fields-actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { ProductPart } from '@/lib/validators/registry'

interface PartSettingsDialogProps {
  brand: string
  part: ProductPart
  onChanged: () => void
}

/**
 * Renaming a part, changing how its files are organised, and removing it.
 *
 * RENAMING IS NOT COSMETIC. The part's name is the key that addresses its
 * files, its field mapping, its colours and the part_role on every job
 * already made from it, so the backend carries all four with it in one
 * transaction. That is why this is a save rather than an inline edit: it is
 * one deliberate action, not a text box that writes as you type.
 *
 * Removing is refused by the backend while work still has to print from the
 * part, and the refusal is shown as it comes back rather than pre-empted
 * here - the page cannot know what the floor is doing a second from now.
 */
export function PartSettingsDialog({
  brand,
  part,
  onChanged,
}: PartSettingsDialogProps): JSX.Element | null {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState(part.role)
  const [perVariant, setPerVariant] = useState(part.per_variant)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setRole(part.role)
    setPerVariant(part.per_variant)
    setError(null)
  }, [open, part.role, part.per_variant])

  // A part still derived from its files has no id to address, so there is
  // nothing to rename or remove yet. It gains one the moment it is saved.
  if (!part.id) return null
  const id = part.id

  async function run(what: () => Promise<{ ok: boolean; error?: string }>): Promise<void> {
    setPending(true)
    setError(null)
    const res = await what()
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not save that.')
      return
    }
    setOpen(false)
    onChanged()
  }

  const trimmed = role.trim()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Settings for ${part.role}`}>
          <Settings2 className="size-3.5" aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{part.role}</DialogTitle>
          <DialogDescription>
            What this part is called, and how its files are organised.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Field label="Name" htmlFor="part-rename">
            <Input id="part-rename" value={role} onChange={e => setRole(e.target.value)} />
          </Field>
          <p className="text-muted-foreground text-xs text-pretty">
            Renaming carries the part&rsquo;s files, its mapping, its colours and every job already
            made from it across to the new name.
          </p>

          <label className="border-border flex items-start gap-3 rounded-md border p-3">
            <Switch
              checked={perVariant}
              onCheckedChange={setPerVariant}
              aria-label="A file for each SKU"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">A file for each SKU</span>
              <span className="text-muted-foreground text-xs text-pretty">
                {perVariant
                  ? 'Every colourway names its own printing and preview file.'
                  : 'One file prints every colourway.'}
              </span>
            </span>
          </label>
          <p className="text-muted-foreground text-xs text-pretty">
            Switching this hides one picker and shows the other. Nothing already chosen is thrown
            away, so switching back finds it still there.
          </p>

          {error ? (
            <p role="alert" className="text-danger text-sm text-pretty">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => void run(() => removePart(brand, id))}
              className="text-danger"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Remove part
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <Button
                disabled={pending || trimmed === ''}
                onClick={() =>
                  void run(() => savePart(brand, id, { role: trimmed, per_variant: perVariant }))
                }
              >
                {pending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
