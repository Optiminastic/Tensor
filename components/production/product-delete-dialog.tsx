'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type JSX, type ReactNode } from 'react'

import { removeProduct } from '@/app/dashboard/[brand]/production/registry-actions'
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
import type { RegistryProductDetail } from '@/lib/validators/registry'

interface ProductDeleteDialogProps {
  brand: string
  product: RegistryProductDetail
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/** How many bill-of-materials lines go with the product, across every variant. */
function partLineCount(product: RegistryProductDetail): number {
  return product.variants.reduce((total, variant) => total + variant.part_count, 0)
}

/**
 * Deletes a product and everything defined under it.
 *
 * Typing the code is not ceremony. Deleting a product cascades to its options,
 * its variants, the designs they print from and their bills of materials -
 * work that took somebody an afternoon to enter and that nothing else in the
 * registry can undo. The dialog counts what will go before asking, because
 * "are you sure?" is not information.
 *
 * The backend demands the code as well, so this is a confirmation of the same
 * fact at both ends rather than a client-side courtesy.
 */
export function ProductDeleteDialog({
  brand,
  product,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: ProductDeleteDialogProps): JSX.Element {
  const router = useRouter()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen

  const [typed, setTyped] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTyped('')
    setError(null)
  }, [open])

  const parts = partLineCount(product)
  const confirmed = typed.trim().toUpperCase() === product.code.toUpperCase()

  async function destroy(): Promise<void> {
    setError(null)
    setPending(true)
    const res = await removeProduct(brand, product.code)
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not delete the product.')
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
          <DialogTitle>Delete {product.code}?</DialogTitle>
          <DialogDescription>
            This cannot be undone. Deleting {product.name} also removes everything defined under it.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <ul className="text-muted-foreground flex flex-col gap-1 text-sm">
            <li>
              <span className="font-mono tabular-nums">{product.options.length}</span> option
              {product.options.length === 1 ? '' : 's'}
            </li>
            <li>
              <span className="font-mono tabular-nums">{product.variants.length}</span> variant
              {product.variants.length === 1 ? '' : 's'}
            </li>
            <li>
              <span className="font-mono tabular-nums">{parts}</span> bill-of-materials line
              {parts === 1 ? '' : 's'}
            </li>
          </ul>
          {/* The parts themselves stay on the shelf. Worth saying: somebody
              deleting a product should not fear it will take the inventory
              with it. */}
          <p className="text-subtle-foreground text-xs">
            The components themselves stay in Inventory. Only this product&rsquo;s use of them goes.
          </p>
          <Field label={`Type ${product.code} to confirm`} htmlFor="p-confirm">
            <Input
              id="p-confirm"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder={product.code}
              autoComplete="off"
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
              variant="danger"
              onClick={() => void destroy()}
              disabled={pending || !confirmed}
            >
              {pending ? 'Deleting…' : 'Delete product'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
