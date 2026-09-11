'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type JSX, type ReactNode } from 'react'

import { addProduct, editProduct } from '@/app/dashboard/[brand]/production/registry-actions'
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
import { Textarea } from '@/components/ui/textarea'
import {
  PRODUCT_KINDS,
  PRODUCT_STATUSES,
  type ProductKind,
  type ProductStatus,
  type RegistryProduct,
} from '@/lib/validators/registry'

interface ProductFormDialogProps {
  brand: string
  /** The product being edited. Omitted to register a new one. */
  product?: RegistryProduct
  /** Rendered as the trigger. Omitted when the caller drives `open` itself. */
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const KIND_HINT: Record<ProductKind, string> = {
  generated: 'Tensor renders the file from a template. No upload per order.',
  uploaded: 'Somebody must supply a design file before a job can print.',
}

/**
 * Registers a product, or corrects one already registered.
 *
 * One dialog for both, because the questions are identical and only the answers
 * start blank. Two would have meant two copies of the kind rule - the one field
 * here that changes how the pipeline behaves.
 *
 * `kind` is a fixed choice rather than free text because it is not a label: it
 * decides whether a job waits for Tensor to render a file or for a person to
 * upload one. A third value would mean a job that waits for neither, which is
 * how a job sits in "profile_missing" forever with nobody able to say why.
 *
 * The code is upper-cased on save. It is the segment an order's SKU carries
 * ("T3DPS-DNP-2"), so one registered as "dnp" matches nothing and fails
 * silently - the worst way for master data to be wrong.
 */
export function ProductFormDialog({
  brand,
  product,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: ProductFormDialogProps): JSX.Element {
  const router = useRouter()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen

  const [code, setCode] = useState(product?.code ?? '')
  const [name, setName] = useState(product?.name ?? '')
  const [kind, setKind] = useState<ProductKind>((product?.kind as ProductKind) ?? 'generated')
  const [status, setStatus] = useState<ProductStatus>(
    (product?.status as ProductStatus) ?? 'active',
  )
  const [notes, setNotes] = useState(product?.notes ?? '')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Re-seed on reopen: the product behind this dialog may have changed since
  // the component mounted, and a form showing stale values would write them
  // straight back over somebody else's edit.
  useEffect(() => {
    if (!open) return
    setCode(product?.code ?? '')
    setName(product?.name ?? '')
    setKind((product?.kind as ProductKind) ?? 'generated')
    setStatus((product?.status as ProductStatus) ?? 'active')
    setNotes(product?.notes ?? '')
    setError(null)
  }, [open, product])

  async function save(): Promise<void> {
    setError(null)
    setPending(true)
    const payload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      kind,
      status,
      notes: notes.trim() === '' ? null : notes.trim(),
    }
    const res = product
      ? await editProduct(brand, product.code, payload)
      : await addProduct(brand, payload)
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not save the product.')
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit product' : 'Add product'}</DialogTitle>
          <DialogDescription>
            {product
              ? 'Correct what this product is. Its options, variants and parts are unaffected.'
              : 'A product family like DNP — the options and variants are added to it afterwards.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code" htmlFor="p-code" hint="Matches the SKU segment">
              <Input
                id="p-code"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="e.g. DNP"
              />
            </Field>
            <Field label="Status" htmlFor="p-status">
              <Select
                id="p-status"
                value={status}
                onChange={e => setStatus(e.target.value as ProductStatus)}
              >
                {PRODUCT_STATUSES.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Name" htmlFor="p-name">
            <Input
              id="p-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Dual Name Plank"
            />
          </Field>
          <Field label="How it is printed" htmlFor="p-kind" hint={KIND_HINT[kind]}>
            <Select id="p-kind" value={kind} onChange={e => setKind(e.target.value as ProductKind)}>
              {PRODUCT_KINDS.map(k => (
                <option key={k} value={k}>
                  {k === 'generated' ? 'Rendered by Tensor' : 'Design file supplied'}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Notes" htmlFor="p-notes" hint="Optional">
            <Textarea
              id="p-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Anything the next person needs to know"
              rows={3}
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
            <Button
              onClick={() => void save()}
              disabled={pending || code.trim() === '' || name.trim() === ''}
            >
              {pending ? 'Saving…' : product ? 'Save changes' : 'Save product'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
