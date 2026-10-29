'use client'

import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type JSX } from 'react'

import {
  setTemplateSectionAction,
  uploadDesignTemplateAction,
} from '@/app/dashboard/[brand]/production/design-template-actions'
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
import { Select } from '@/components/ui/select'

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
  // Where it will be filed. '' is automatic: the heading its use implies,
  // which for a file nothing links to yet is Other.
  const [section, setSection] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setKey('')
    setFile(null)
    setSection('')
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
    if (!result.ok) {
      setPending(false)
      setError(result.error ?? 'Could not add the design file.')
      return
    }

    // FILED AFTER THE UPLOAD, and a failure here does not undo it. The file is
    // in - that is the part that took a decision - and a label that did not
    // stick is a dropdown to change, not an upload to do again. Saying so is
    // better than rolling back the thing somebody wanted.
    if (section !== '') {
      const filed = await setTemplateSectionAction(brand, normalised, section)
      if (!filed.ok) {
        setPending(false)
        setError(
          `${normalised} was added, but could not be filed under that section: ${
            filed.error ?? 'the request was refused'
          }. Set it from its row.`,
        )
        router.refresh()
        return
      }
    }

    setPending(false)
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

          {/* Where it lands on this page. Not what it is FOR - that is
              decided by which product links it, on the product. */}
          <Field
            label="Section"
            htmlFor="t-section"
            hint="Where it is filed on this page. It does not decide what the file is used for."
          >
            <Select
              id="t-section"
              value={section}
              disabled={pending}
              onChange={e => setSection(e.target.value)}
            >
              <option value="">Automatic — by what links to it</option>
              <option value="print">Printing files</option>
              <option value="preview">Personalisation preview</option>
              <option value="other">Other</option>
            </Select>
          </Field>

          {taken ? (
            <p className="text-warning text-xs">
              A design with that key already exists. Use Replace on its row to upload a new version.
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
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
