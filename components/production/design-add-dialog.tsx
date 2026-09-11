'use client'

import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type JSX } from 'react'

import { uploadDesignTemplateAction } from '@/app/dashboard/[brand]/production/design-template-actions'
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

interface DesignAddDialogProps {
  brand: string
  /** Keys already taken. Adding one of these would replace it, not add. */
  existingKeys: string[]
}

/**
 * Adds a design file under a new key.
 *
 * The key is the name the renderer looks up and a variant links to, so it is
 * asked for rather than derived from the filename: "dnp_two_heart (2).scad"
 * dragged from a downloads folder would otherwise become a template key nobody
 * can type, pointing at nothing.
 *
 * Adding a key that already exists is refused here rather than silently
 * uploading. The endpoint treats a repeat key as a new VERSION of that
 * template - correct for Replace, and wrong for someone who believes they are
 * adding a second design and has just overwritten the first.
 */
export function DesignAddDialog({ brand, existingKeys }: DesignAddDialogProps): JSX.Element {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [key, setKey] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setKey('')
    setFile(null)
    setError(null)
  }, [open])

  const normalised = key.trim().toLowerCase()
  const taken = existingKeys.some(k => k.toLowerCase() === normalised)

  async function save(): Promise<void> {
    if (!file) {
      setError('Choose a .scad file.')
      return
    }
    setError(null)
    setPending(true)
    const form = new FormData()
    form.set('file', file)
    const result = await uploadDesignTemplateAction(brand, normalised, form)
    setPending(false)
    if (!result.ok) {
      setError(result.error ?? 'Could not add the design file.')
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-3.5" aria-hidden />
          Add design file
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add design file</DialogTitle>
          <DialogDescription>
            An OpenSCAD .scad file, under a key that variants can link to.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field
            label="Template key"
            htmlFor="t-key"
            hint="Lower case, no spaces — e.g. dnp_three_heart"
          >
            <Input
              id="t-key"
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="dnp_three_heart"
              autoComplete="off"
            />
          </Field>

          <Field label="File" htmlFor="t-file" hint={file ? file.name : 'No file chosen'}>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                id="t-file"
                type="file"
                accept=".scad"
                className="hidden"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={pending}
              >
                Choose .scad
              </Button>
            </div>
          </Field>

          {taken ? (
            <p className="text-warning text-xs">
              A design with that key already exists. Use Replace on its row to upload a new version.
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              onClick={() => void save()}
              disabled={pending || normalised === '' || taken || !file}
            >
              {pending ? 'Uploading…' : 'Add design file'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
