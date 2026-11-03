'use client'

import { Plus } from 'lucide-react'
import { useEffect, useState, type JSX, type ReactNode } from 'react'

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

interface PartAddDialogProps {
  /** Names already taken on this product. A repeat would replace, not add. */
  existingRoles: string[]
  onAdd: (role: string, perVariant: boolean) => Promise<void> | void
  trigger: ReactNode
}

/**
 * Names a part, and says how its files are organised.
 *
 * NO FILE IS ASKED FOR. The dialog this replaced wanted a name AND a file
 * before it would do anything, which is the wrong shape: a part is not one
 * file. A combo's keychain has a file that prints and a file the customer is
 * shown, and may have a different pair for every colourway - so demanding one
 * up front meant the first of eight was given somewhere else, in some other
 * form, from the other seven.
 *
 * THE ONE QUESTION THAT IS ASKED decides the whole panel underneath: one file
 * for every colourway, or a file per child SKU. Both used to be offered at
 * once, every part showing a product-wide picker AND a row per SKU, with
 * nothing saying which was meant to win.
 *
 * Defaulted to per-SKU because that is the case the registry exists for. A
 * product whose colourways are one geometry can say so in one click; one
 * whose colourways are different drawings cannot be said any other way.
 */
export function PartAddDialog({ existingRoles, onAdd, trigger }: PartAddDialogProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState('')
  const [perVariant, setPerVariant] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setRole('')
    setPerVariant(true)
    setError(null)
  }, [open])

  const trimmed = role.trim().toLowerCase()
  const taken = existingRoles.some(r => r.toLowerCase() === trimmed)
  const ready = trimmed !== '' && !taken && !pending

  async function save(): Promise<void> {
    if (!ready) return
    setPending(true)
    setError(null)
    try {
      await onAdd(trimmed, perVariant)
      setOpen(false)
    } catch {
      setError('Could not add the part.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add a part</DialogTitle>
          <DialogDescription>
            One for most products. A combo needs one for each thing it prints — each becomes its own
            job, on its own bed, in its own colour.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Field
            label="What is it"
            htmlFor="part-role"
            hint="What an operator will read beside the job — plank, rose, keychain"
          >
            <Input
              id="part-role"
              autoFocus
              value={role}
              onChange={e => setRole(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void save()
                }
              }}
              placeholder="e.g. rose"
            />
          </Field>
          {taken ? (
            <p className="text-warning text-xs">This product already prints a {trimmed}.</p>
          ) : null}

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
                  ? 'Every colourway names its own printing and preview file — what a product whose colourways are different drawings needs.'
                  : 'One file prints every colourway. What a plank needs, where twenty SKUs are one shape in twenty filaments.'}
              </span>
            </span>
          </label>

          {error ? (
            <p role="alert" className="text-danger text-sm">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={!ready}>
              <Plus className="size-3.5" aria-hidden />
              {pending ? 'Adding…' : 'Add part'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
