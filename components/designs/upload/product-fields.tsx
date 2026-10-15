import { ChevronDown } from 'lucide-react'
import type { JSX } from 'react'
import type { UseFormRegister } from 'react-hook-form'

import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

import type { UploadFormValues } from './upload-schema'

interface ProductFieldsProps {
  register: UseFormRegister<UploadFormValues>
}

/**
 * What the product is. All optional, so it starts folded: a designer who
 * only needs a price can skip it, and the details can be added later.
 */
export function ProductFields({ register }: ProductFieldsProps): JSX.Element {
  return (
    <details className="group bg-surface-muted rounded-2xl">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        Product details
        <span className="text-muted-foreground flex items-center gap-2 text-xs font-normal">
          Optional
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
        </span>
      </summary>
      <div className="grid gap-4 px-4 pb-4 sm:grid-cols-2">
        <Field label="Product type" htmlFor="product_type">
          <Input
            id="product_type"
            placeholder="e.g. nameplate, planter"
            {...register('product_type')}
          />
        </Field>
        <Field label="Personalisation" htmlFor="personalisation_type">
          <Input
            id="personalisation_type"
            placeholder="e.g. name, photo"
            {...register('personalisation_type')}
          />
        </Field>
        <Field label="Colour count" htmlFor="colour_count" hint="Filled in from a 3MF">
          <Input
            id="colour_count"
            type="number"
            min={1}
            max={20}
            {...register('colour_count', { valueAsNumber: true })}
          />
        </Field>
        <Field label="Packaging" htmlFor="packaging_type">
          <Input
            id="packaging_type"
            placeholder="e.g. box, mailer"
            {...register('packaging_type')}
          />
        </Field>
        <Field label="Add-ons" htmlFor="add_ons" hint="Comma-separated" className="sm:col-span-2">
          <Input id="add_ons" placeholder="light, base, stand, frame" {...register('add_ons')} />
        </Field>
      </div>
    </details>
  )
}
