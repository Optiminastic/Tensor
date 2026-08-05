'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type JSX } from 'react'
import { type FieldError, useForm } from 'react-hook-form'

import { resubmitDesign } from '@/app/dashboard/[brand]/designs/actions'
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
import { DesignSpecsSchema, MaterialSchema } from '@/lib/validators/designs'
import type { DesignSpecs, QualitySchema } from '@/lib/validators/designs'

const MATERIALS = MaterialSchema.options
const FINISHES: { value: string; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'sanded', label: 'Sanded' },
  { value: 'painted', label: 'Painted' },
]
// Labels are the literal BBL H2C system preset names shown in Bambu Studio -
// values are the backend's matching slugs (internal/httpapi/designs.go).
const QUALITIES: { value: (typeof QualitySchema.options)[number]; label: string }[] = [
  { value: '0.08-high', label: '0.08mm High Quality @BBL H2C' },
  { value: '0.12-high', label: '0.12mm High Quality @BBL H2C' },
  { value: '0.16-high', label: '0.16mm High Quality @BBL H2C' },
  { value: '0.16-standard', label: '0.16mm Standard @BBL H2C' },
  { value: '0.20-high', label: '0.20mm High Quality @BBL H2C' },
  { value: '0.20-standard', label: '0.20mm Standard @BBL H2C' },
  { value: '0.24-standard', label: '0.24mm Standard @BBL H2C' },
]

interface DesignResubmitFormProps {
  brand: string
  designId: string
  current: DesignSpecs
  onResubmitted: () => void
}

/** Change the answers and re-slice the same model - the green loop. The form
 * lives in a dialog behind a button, and closes itself on a successful re-slice. */
export function DesignResubmitForm({
  brand,
  designId,
  current,
  onResubmitted,
}: DesignResubmitFormProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DesignSpecs>({ resolver: zodResolver(DesignSpecsSchema), defaultValues: current })

  async function onSubmit(values: DesignSpecs): Promise<void> {
    setError(null)
    const outcome = await resubmitDesign(brand, designId, values)
    if (!outcome.ok) {
      setError(outcome.error ?? 'Could not re-slice this design.')
      return
    }
    setOpen(false)
    onResubmitted()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="self-start">
          Adjust and re-slice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Adjust and re-slice</DialogTitle>
          <DialogDescription>Change the answers and re-slice the same model.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Material" htmlFor="rs-material" error={errors.material?.message}>
              <Select id="rs-material" {...register('material')}>
                {MATERIALS.map(m => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Quality" htmlFor="rs-quality" error={errors.quality?.message}>
              <Select id="rs-quality" {...register('quality')}>
                {QUALITIES.map(q => (
                  <option key={q.value} value={q.value}>
                    {q.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Finish" htmlFor="rs-finish" error={errors.finish?.message}>
              <Select id="rs-finish" {...register('finish')}>
                {FINISHES.map(f => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Colour" htmlFor="rs-colour" hint="Optional">
              <Input id="rs-colour" {...register('colour')} />
            </Field>
            <Field
              label="Units per bed"
              htmlFor="rs-units"
              error={(errors.units_per_bed as FieldError | undefined)?.message}
            >
              <Input
                id="rs-units"
                type="number"
                step="1"
                data-numeric="true"
                {...register('units_per_bed', { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Infill %"
              htmlFor="rs-infill"
              error={(errors.infill_pct as FieldError | undefined)?.message}
            >
              <Input
                id="rs-infill"
                type="number"
                step="1"
                data-numeric="true"
                {...register('infill_pct', { valueAsNumber: true })}
              />
            </Field>
          </div>

          {error ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={isSubmitting} className="self-start">
            {isSubmitting ? 'Re-slicing…' : 'Re-slice with these settings'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
