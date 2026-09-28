'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type JSX, type ReactNode } from 'react'

import { assignProductDesign } from '@/app/dashboard/[brand]/production/design-fields-actions'
import { uploadDesignTemplateAction } from '@/app/dashboard/[brand]/production/design-template-actions'
import { useDesignTemplates } from '@/components/production/design-templates-context'
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

interface PartAddDialogProps {
  brand: string
  productCode: string
  /** Names already taken on this product. A repeat would replace, not add. */
  existingRoles: string[]
  onAdded: () => void
  trigger: ReactNode
}

/**
 * Adds a design file to a product.
 *
 * Most products print one thing and this is used once. A Soulmate Combo prints
 * three - a plank, a rose and a keychain - and each needs its own file, its
 * own variables and its own fields from the customer.
 *
 * The name is what an operator reads on the bed list beside the job, so it is
 * asked for in their words rather than derived: "rose" and "keychain", not
 * "body" and "part_2".
 *
 * A file can be uploaded here or chosen from one already in the registry. The
 * second matters more than it looks: two products that print the same keychain
 * should point at one file, not two copies that drift.
 */
export function PartAddDialog({
  brand,
  productCode,
  existingRoles,
  onAdded,
  trigger,
}: PartAddDialogProps): JSX.Element {
  const router = useRouter()
  const templates = useDesignTemplates()
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState('')
  const [choice, setChoice] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    // First part of a product is almost always the product itself, and 'body'
    // is what every product configured before parts already uses - so the
    // common case is one keystroke rather than a decision.
    setRole(existingRoles.length === 0 ? 'body' : '')
    setChoice('')
    setFile(null)
    setError(null)
  }, [open, existingRoles.length])

  const trimmed = role.trim().toLowerCase()
  const taken = existingRoles.some(r => r.toLowerCase() === trimmed)
  // The key an uploaded file is filed under: the product and the part, which
  // is unique per part and reads as itself in the Designs tab.
  const uploadKey = `${productCode.toLowerCase()}_${trimmed.replace(/[^a-z0-9]+/g, '_')}`

  async function save(): Promise<void> {
    setError(null)
    setPending(true)

    let key = choice
    if (file) {
      const form = new FormData()
      form.set('file', file)
      const uploaded = await uploadDesignTemplateAction(brand, uploadKey, form)
      if (!uploaded.ok) {
        setPending(false)
        setError(uploaded.error ?? 'Could not upload the template.')
        return
      }
      key = uploadKey
    }

    const res = await assignProductDesign(brand, productCode, { role: trimmed, template_key: key })
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not add the design file.')
      return
    }
    setOpen(false)
    onAdded()
    router.refresh()
  }

  const ready = trimmed !== '' && !taken && (file !== null || choice !== '')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add a design file</DialogTitle>
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
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="e.g. rose"
            />
          </Field>
          {taken ? (
            <p className="text-warning text-xs">
              This product already prints a {trimmed}. Adding it again would replace that file — go
              back and edit it instead.
            </p>
          ) : null}

          <Field label="Use an existing template" htmlFor="part-template" hint="Optional">
            <Select
              id="part-template"
              value={choice}
              onChange={e => {
                setChoice(e.target.value)
                if (e.target.value !== '') setFile(null)
              }}
              disabled={file !== null}
            >
              <option value="">None — upload a file below</option>
              {templates.map(t => (
                <option key={t.key} value={t.key}>
                  {t.key}
                  {t.source === 'uploaded' ? ` · v${t.version}` : ' · built in'}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Or upload a .scad"
            htmlFor="part-file"
            hint={trimmed === '' ? 'Name it first' : `Filed under ${uploadKey}`}
          >
            <Input
              id="part-file"
              type="file"
              accept=".scad"
              disabled={trimmed === '' || choice !== ''}
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </Field>

          {error ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={pending || !ready}>
              {pending ? 'Adding…' : 'Add design file'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
