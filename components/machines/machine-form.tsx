'use client'

import { useEffect, useState, type JSX, type ReactNode } from 'react'

import {
  createMachineAction,
  fetchProfileOptions,
  updateMachineAction,
} from '@/app/dashboard/machines/actions'
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
import type { Machine, ProfileOptions } from '@/lib/validators/machines'

const NOZZLES = [0.2, 0.4, 0.6, 0.8]
const STATUSES = ['online', 'busy', 'offline', 'maintenance']

interface MachineFormProps {
  machine?: Machine
  trigger: ReactNode
  onSaved: () => void
}

/** Create or edit a machine's slicing config in a dialog. The filament and layer
 * options are fetched for the chosen nozzle, so only sliceable config is offered. */
export function MachineForm({ machine, trigger, onSaved }: MachineFormProps): JSX.Element {
  const editing = Boolean(machine)
  const [open, setOpen] = useState(false)

  const [name, setName] = useState(machine?.name ?? '')
  const [nozzle, setNozzle] = useState(machine?.nozzle_mm ?? 0.4)
  const [flow, setFlow] = useState(machine?.flow ?? 'standard')
  const [colour, setColour] = useState(machine?.default_colour ?? '')
  const [status, setStatus] = useState(machine?.status ?? 'offline')
  const [isActive, setIsActive] = useState(machine?.is_active ?? true)
  const [isDefault, setIsDefault] = useState(machine?.is_default ?? false)

  const [options, setOptions] = useState<ProfileOptions | null>(null)
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set((machine?.supported_filaments ?? []).map(f => f.filament_preset)),
  )
  const [defaultPreset, setDefaultPreset] = useState(
    machine?.supported_filaments.find(f => f.is_default)?.filament_preset ?? '',
  )
  const [layerMin, setLayerMin] = useState(machine?.layer_height_min_mm ?? 0.08)
  const [layerMax, setLayerMax] = useState(machine?.layer_height_max_mm ?? 0.28)

  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void fetchProfileOptions('H2S', nozzle).then(res => {
      if (!cancelled && res.ok && res.data) setOptions(res.data)
    })
    return () => {
      cancelled = true
    }
  }, [open, nozzle])

  // Keep the filament/layer selections valid for the fetched options.
  useEffect(() => {
    if (!options) return
    const valid = new Set(options.filaments.map(f => f.filament_preset))
    setSelected(prev => {
      const next = new Set([...prev].filter(p => valid.has(p)))
      if (next.size === 0) options.filaments.forEach(f => next.add(f.filament_preset))
      return next
    })
    const heights = options.layer_heights
    if (heights.length > 0) {
      setLayerMin(m => (heights.includes(m) ? m : heights[0]))
      setLayerMax(m => (heights.includes(m) ? m : heights[heights.length - 1]))
    }
  }, [options])

  function toggle(preset: string): void {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(preset)) next.delete(preset)
      else next.add(preset)
      return next
    })
  }

  async function save(): Promise<void> {
    if (!options) return
    setError(null)
    setPending(true)
    const def = selected.has(defaultPreset) ? defaultPreset : [...selected][0]
    const supported_filaments = options.filaments
      .filter(f => selected.has(f.filament_preset))
      .map(f => ({
        material: f.material,
        filament_preset: f.filament_preset,
        density: f.density,
        is_default: f.filament_preset === def,
      }))
    const input = {
      name: name.trim(),
      family: 'H2S',
      nozzle_mm: nozzle,
      flow,
      default_colour: colour.trim() || null,
      layer_height_min_mm: layerMin,
      layer_height_max_mm: layerMax,
      supported_filaments,
      status,
      is_active: isActive,
      is_default: isDefault,
    }
    const res = machine
      ? await updateMachineAction(machine.id, input)
      : await createMachineAction(input)
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not save the machine.')
      return
    }
    setOpen(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit machine' : 'Add machine'}</DialogTitle>
          <DialogDescription>
            The nozzle decides which filaments and layer heights are available.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="m-name">
              <Input id="m-name" value={name} onChange={e => setName(e.target.value)} />
            </Field>
            <Field label="Family" htmlFor="m-family">
              <Select id="m-family" value="H2S" disabled>
                <option value="H2S">Bambu H2S</option>
              </Select>
            </Field>
            <Field label="Nozzle" htmlFor="m-nozzle" hint="mm">
              <Select
                id="m-nozzle"
                value={nozzle}
                onChange={e => setNozzle(Number(e.target.value))}
              >
                {NOZZLES.map(n => (
                  <option key={n} value={n}>
                    {n.toFixed(1)} mm
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Flow" htmlFor="m-flow">
              <Select id="m-flow" value={flow} onChange={e => setFlow(e.target.value)}>
                <option value="standard">Standard</option>
                <option value="high_flow">High flow</option>
              </Select>
            </Field>
            <Field label="Default colour" htmlFor="m-colour" hint="Optional">
              <Input id="m-colour" value={colour} onChange={e => setColour(e.target.value)} />
            </Field>
            <Field label="Status" htmlFor="m-status">
              <Select id="m-status" value={status} onChange={e => setStatus(e.target.value)}>
                {STATUSES.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Layer height min" htmlFor="m-lmin" hint="mm">
              <Select
                id="m-lmin"
                value={layerMin}
                onChange={e => setLayerMin(Number(e.target.value))}
              >
                {(options?.layer_heights ?? [layerMin]).map(h => (
                  <option key={h} value={h}>
                    {h.toFixed(2)} mm
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Layer height max" htmlFor="m-lmax" hint="mm">
              <Select
                id="m-lmax"
                value={layerMax}
                onChange={e => setLayerMax(Number(e.target.value))}
              >
                {(options?.layer_heights ?? [layerMax]).map(h => (
                  <option key={h} value={h}>
                    {h.toFixed(2)} mm
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Active" htmlFor="m-active">
              <Select
                id="m-active"
                value={isActive ? 'yes' : 'no'}
                onChange={e => setIsActive(e.target.value === 'yes')}
              >
                <option value="yes">Active</option>
                <option value="no">Inactive</option>
              </Select>
            </Field>
            <Field label="Default machine" htmlFor="m-default">
              <Select
                id="m-default"
                value={isDefault ? 'yes' : 'no'}
                onChange={e => setIsDefault(e.target.value === 'yes')}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </Select>
            </Field>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-subtle-foreground text-xs font-medium tracking-wide uppercase">
              Supported filaments
            </p>
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {(options?.filaments ?? []).map(f => (
                <li key={f.filament_preset} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-accent"
                    checked={selected.has(f.filament_preset)}
                    onChange={() => toggle(f.filament_preset)}
                    aria-label={f.material}
                  />
                  <span className="text-foreground flex-1 truncate">{f.material}</span>
                  <label className="text-muted-foreground flex items-center gap-1 text-xs">
                    <input
                      type="radio"
                      name="default-filament"
                      className="accent-accent"
                      checked={defaultPreset === f.filament_preset}
                      onChange={() => setDefaultPreset(f.filament_preset)}
                    />
                    default
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {error ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
              {error}
            </p>
          ) : null}

          <Button className="self-start" disabled={pending || !options} onClick={() => void save()}>
            {pending ? 'Saving…' : editing ? 'Save changes' : 'Add machine'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
