'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Tag } from 'lucide-react'
import { useState, type JSX } from 'react'
import { useForm } from 'react-hook-form'

import { setDesignSkuForBrand } from '@/app/dashboard/[brand]/designs/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { type DesignSkuInput, DesignSkuInputSchema } from '@/lib/validators/designs'

interface DesignSkuDialogProps {
  brand: string
  designId: string
  currentSku: string | null
  onSaved: () => void
}

/** Assign or edit a design's catalog SKU - the code an incoming order resolves to
 * this design. Guarded server-side by shopify:publish; the caller hides the
 * trigger for users without it. */
export function DesignSkuDialog({
  brand,
  designId,
  currentSku,
  onSaved,
}: DesignSkuDialogProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DesignSkuInput>({
    resolver: zodResolver(DesignSkuInputSchema),
    defaultValues: { sku: currentSku ?? '' },
  })

  async function onSubmit(values: DesignSkuInput): Promise<void> {
    setError(null)
    const res = await setDesignSkuForBrand(brand, designId, values)
    if (!res.ok) {
      setError(res.error ?? 'Could not save the SKU.')
      return
    }
    setOpen(false)
    onSaved()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        setOpen(next)
        if (next) {
          setError(null)
          reset({ sku: currentSku ?? '' })
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Tag aria-hidden />
          {currentSku ? 'Edit SKU' : 'Assign SKU'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{currentSku ? 'Edit SKU' : 'Assign SKU'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field
            label="SKU"
            htmlFor="sku"
            hint="The catalog code an order resolves to this design. Leave blank to clear."
            error={errors.sku?.message}
          >
            <Input id="sku" placeholder="GF-LAMP-001-PLA-WHT-V1" {...register('sku')} />
          </Field>
          {error ? (
            <p role="alert" className="text-danger text-sm">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save SKU'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
