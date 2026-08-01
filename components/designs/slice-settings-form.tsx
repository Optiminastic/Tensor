'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useEffect, useState, type JSX } from 'react'
import { type FieldError, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { fetchMachines, resliceWithSettings } from '@/app/dashboard/[brand]/designs/actions'
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
import { type DesignSpecs, type ResubmitInput, InfillPatternSchema } from '@/lib/validators/designs'
import type { Machine } from '@/lib/validators/machines'

const LAYER_HEIGHTS = [0.08, 0.12, 0.16, 0.2, 0.24, 0.28] as const

const PATTERNS: { value: string; label: string }[] = [
  { value: 'grid', label: 'Grid' },
  { value: 'gyroid', label: 'Gyroid' },
  { value: 'honeycomb', label: 'Honeycomb' },
  { value: 'cubic', label: 'Cubic' },
  { value: 'triangles', label: 'Triangles' },
  { value: 'concentric', label: 'Concentric' },
  { value: 'line', label: 'Line' },
  { value: 'tri-hexagon', label: 'Tri-hexagon' },
  { value: 'lightning', label: 'Lightning' },
]

// The layer height each quality preset implies, used as the form's starting point.
const DEFAULT_LAYER_HEIGHT: Record<string, number> = { draft: 0.24, standard: 0.2, fine: 0.12 }

const StudioFormSchema = z.object({
  infill_pct: z.number().min(0).max(100),
  layer_height_mm: z.number().min(0.08).max(0.28),
  wall_loops: z.number().int().min(1).max(8),
  infill_pattern: InfillPatternSchema,
  support: z.enum(['on', 'off']),
  support_threshold_deg: z.number().int().min(0).max(90),
})
type StudioForm = z.infer<typeof StudioFormSchema>

interface SliceSettingsFormProps {
  brand: string
  designId: string
  current: DesignSpecs
  onResliced: () => void
}

/** The Slice Studio controls: tune the advanced slice parameters and re-slice.
 * The design's material / quality / finish / units ride along unchanged; the
 * backend re-clamps every value before it reaches the slicer. */
export function SliceSettingsForm({
  brand,
  designId,
  current,
  onResliced,
}: SliceSettingsFormProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [machines, setMachines] = useState<Machine[]>([])
  const [machineId, setMachineId] = useState('')
  const [filamentPreset, setFilamentPreset] = useState('')

  useEffect(() => {
    let cancelled = false
    void fetchMachines().then(res => {
      if (!cancelled && res.ok && res.data) setMachines(res.data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const machine = machines.find(m => m.id === machineId)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<StudioForm>({
    resolver: zodResolver(StudioFormSchema),
    defaultValues: {
      infill_pct: current.infill_pct,
      layer_height_mm: DEFAULT_LAYER_HEIGHT[current.quality] ?? 0.2,
      wall_loops: 2,
      infill_pattern: 'grid',
      support: 'on',
      support_threshold_deg: 30,
    },
  })

  const supportOff = useWatch({ control, name: 'support' }) === 'off'

  async function onSubmit(values: StudioForm): Promise<void> {
    setError(null)
    const input: ResubmitInput = {
      ...current,
      infill_pct: values.infill_pct,
      layer_height_mm: values.layer_height_mm,
      wall_loops: values.wall_loops,
      infill_pattern: values.infill_pattern,
      support: values.support === 'on',
      support_threshold_deg: values.support_threshold_deg,
      ...(machineId ? { machine_id: machineId } : {}),
      ...(filamentPreset ? { filament_preset: filamentPreset } : {}),
    }
    const outcome = await resliceWithSettings(brand, designId, input)
    if (!outcome.ok) {
      setError(outcome.error ?? 'Could not re-slice with these settings.')
      return
    }
    setOpen(false)
    onResliced()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="self-start">
          Slice settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Slice settings</DialogTitle>
          <DialogDescription>
            Tune the slice and re-run it. The layers and the price update when it finishes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-3">
            {machines.length > 0 ? (
              <Field label="Machine" htmlFor="ss-machine" hint="Slices on this machine">
                <Select
                  id="ss-machine"
                  value={machineId}
                  onChange={e => {
                    setMachineId(e.target.value)
                    setFilamentPreset('')
                  }}
                >
                  <option value="">Default profile</option>
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.nozzle_mm.toFixed(1)}mm)
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <div className="sm:col-span-3">
                <p className="text-muted-foreground text-sm">
                  No machines configured yet.{' '}
                  <Link
                    href="/dashboard/machines"
                    className="text-accent underline-offset-2 hover:underline"
                  >
                    Add one in Machine Settings
                  </Link>{' '}
                  to slice on a specific printer. Until then this uses the default profile.
                </p>
              </div>
            )}
            {machine ? (
              <Field label="Filament" htmlFor="ss-filament">
                <Select
                  id="ss-filament"
                  value={filamentPreset}
                  onChange={e => setFilamentPreset(e.target.value)}
                >
                  <option value="">Auto (by material)</option>
                  {machine.supported_filaments.map(f => (
                    <option key={f.filament_preset} value={f.filament_preset}>
                      {f.material}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
            <Field label="Layer height" htmlFor="ss-layer" hint="mm">
              <Select id="ss-layer" {...register('layer_height_mm', { valueAsNumber: true })}>
                {LAYER_HEIGHTS.map(h => (
                  <option key={h} value={h}>
                    {h.toFixed(2)} mm
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Infill"
              htmlFor="ss-infill"
              hint="%"
              error={(errors.infill_pct as FieldError | undefined)?.message}
            >
              <Input
                id="ss-infill"
                type="number"
                step="1"
                data-numeric="true"
                {...register('infill_pct', { valueAsNumber: true })}
              />
            </Field>
            <Field label="Infill pattern" htmlFor="ss-pattern">
              <Select id="ss-pattern" {...register('infill_pattern')}>
                {PATTERNS.map(p => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Wall loops"
              htmlFor="ss-walls"
              error={(errors.wall_loops as FieldError | undefined)?.message}
            >
              <Input
                id="ss-walls"
                type="number"
                step="1"
                min="1"
                max="8"
                data-numeric="true"
                {...register('wall_loops', { valueAsNumber: true })}
              />
            </Field>
            <Field label="Supports" htmlFor="ss-support">
              <Select id="ss-support" {...register('support')}>
                <option value="on">On (auto)</option>
                <option value="off">Off</option>
              </Select>
            </Field>
            <Field
              label="Support threshold"
              htmlFor="ss-support-deg"
              hint={supportOff ? 'Supports off' : 'degrees'}
              error={(errors.support_threshold_deg as FieldError | undefined)?.message}
            >
              <Input
                id="ss-support-deg"
                type="number"
                step="1"
                min="0"
                max="90"
                disabled={supportOff}
                data-numeric="true"
                {...register('support_threshold_deg', { valueAsNumber: true })}
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
