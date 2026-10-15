import type { JSX } from 'react'
import type { FieldError, FieldErrors, UseFormRegister } from 'react-hook-form'

import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { QUALITY_OPTIONS } from '@/lib/validators/designs'

import { FINISHES, MATERIALS, type UploadFormValues } from './upload-schema'

interface FieldGroupProps {
  register: UseFormRegister<UploadFormValues>
  errors: FieldErrors<UploadFormValues>
}

/** How it is printed: the settings the slicer costs it with. */
export function PrintSettingsFields({ register, errors }: FieldGroupProps): JSX.Element {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Material" htmlFor="material" error={errors.material?.message}>
        <Select id="material" {...register('material')}>
          {MATERIALS.map(m => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Quality" htmlFor="quality" error={errors.quality?.message}>
        <Select id="quality" {...register('quality')}>
          {QUALITY_OPTIONS.map(q => (
            <option key={q.value} value={q.value}>
              {q.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Finish" htmlFor="finish" error={errors.finish?.message}>
        <Select id="finish" {...register('finish')}>
          {FINISHES.map(f => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Colour" htmlFor="colour" hint="Filled in from a 3MF">
        <Input id="colour" placeholder="e.g. Matte black" {...register('colour')} />
      </Field>
      <NumberField
        id="units_per_bed"
        label="Units per bed"
        register={register}
        error={errors.units_per_bed}
      />
      <NumberField id="infill_pct" label="Infill %" register={register} error={errors.infill_pct} />
    </div>
  )
}

interface NumberFieldProps {
  id: 'units_per_bed' | 'infill_pct'
  label: string
  register: UseFormRegister<UploadFormValues>
  error?: FieldError
}

function NumberField({ id, label, register, error }: NumberFieldProps): JSX.Element {
  return (
    <Field label={label} htmlFor={id} error={error?.message}>
      <Input
        id={id}
        type="number"
        step="1"
        data-numeric="true"
        {...register(id, { valueAsNumber: true })}
      />
    </Field>
  )
}
