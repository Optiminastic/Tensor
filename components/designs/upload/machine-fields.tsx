import type { JSX } from 'react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'

import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'

import { FLOWS, NOZZLES_MM, type UploadFormValues } from './upload-schema'

type Side = 'left' | 'right'

interface ExtruderProps {
  side: Side
  register: UseFormRegister<UploadFormValues>
  errors: FieldErrors<UploadFormValues>
}

/** One extruder of the dual-nozzle printer: its nozzle and its flow. */
function Extruder({ side, register, errors }: ExtruderProps): JSX.Element {
  const nozzle = `${side}_nozzle_mm` as const
  const flow = `${side}_flow` as const
  return (
    <div className="ring-border flex flex-col gap-3 rounded-2xl p-4 ring-1">
      <p className="text-sm font-medium">{side === 'left' ? 'Left extruder' : 'Right extruder'}</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nozzle" htmlFor={nozzle} error={errors[nozzle]?.message}>
          <Select id={nozzle} data-numeric="true" {...register(nozzle, { valueAsNumber: true })}>
            {NOZZLES_MM.map(n => (
              <option key={n} value={n}>
                {n.toFixed(1)} mm
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Flow" htmlFor={flow} error={errors[flow]?.message}>
          <Select id={flow} {...register(flow)}>
            {FLOWS.map(f => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </div>
  )
}

interface MachineFieldsProps {
  register: UseFormRegister<UploadFormValues>
  errors: FieldErrors<UploadFormValues>
}

/** Both extruders, side by side the way they sit on the printer. */
export function MachineFields({ register, errors }: MachineFieldsProps): JSX.Element {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Extruder side="left" register={register} errors={errors} />
      <Extruder side="right" register={register} errors={errors} />
    </div>
  )
}
