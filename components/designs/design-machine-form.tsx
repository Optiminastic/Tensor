'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type JSX } from 'react'
import { useForm } from 'react-hook-form'

import { updateDesignMachineForBrand } from '@/app/dashboard/[brand]/designs/machine-actions'
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
import { Select } from '@/components/ui/select'
import { type DesignMachineSpec, DesignMachineSpecSchema } from '@/lib/validators/designs'

const NOZZLES_MM = [0.2, 0.4, 0.6, 0.8] as const
const FLOWS: { value: 'standard' | 'high_flow'; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'high_flow', label: 'High Flow' },
]

interface DesignMachineFormProps {
  brand: string
  designId: string
  current: DesignMachineSpec
  onChanged: () => void
}

/** Relinks a design to a different dual-nozzle slicing config - resolved
 * server-side to a machine_profiles row, same as the upload form. */
export function DesignMachineForm({
  brand,
  designId,
  current,
  onChanged,
}: DesignMachineFormProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<DesignMachineSpec>({
    resolver: zodResolver(DesignMachineSpecSchema),
    defaultValues: current,
  })

  async function onSubmit(values: DesignMachineSpec): Promise<void> {
    setError(null)
    const outcome = await updateDesignMachineForBrand(brand, designId, values)
    if (!outcome.ok) {
      setError(outcome.error ?? 'Could not update the machine configuration.')
      return
    }
    setOpen(false)
    onChanged()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        setOpen(next)
        if (next) {
          setError(null)
          reset(current)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" className="self-start">
          Change machine configuration
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Change machine configuration</DialogTitle>
          <DialogDescription>
            Picks (or creates) the printer profile matching this nozzle and flow setup.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Left nozzle" htmlFor="dm-left-nozzle" hint="mm">
              <Select
                id="dm-left-nozzle"
                data-numeric="true"
                {...register('left_nozzle_mm', { valueAsNumber: true })}
              >
                {NOZZLES_MM.map(n => (
                  <option key={n} value={n}>
                    {n.toFixed(1)} mm
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Left flow" htmlFor="dm-left-flow">
              <Select id="dm-left-flow" {...register('left_flow')}>
                {FLOWS.map(f => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Right nozzle" htmlFor="dm-right-nozzle" hint="mm">
              <Select
                id="dm-right-nozzle"
                data-numeric="true"
                {...register('right_nozzle_mm', { valueAsNumber: true })}
              >
                {NOZZLES_MM.map(n => (
                  <option key={n} value={n}>
                    {n.toFixed(1)} mm
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Right flow" htmlFor="dm-right-flow">
              <Select id="dm-right-flow" {...register('right_flow')}>
                {FLOWS.map(f => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {error ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={isSubmitting} className="self-start">
            {isSubmitting ? 'Saving…' : 'Save machine configuration'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
