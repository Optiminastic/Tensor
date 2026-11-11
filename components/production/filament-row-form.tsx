'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent, type JSX } from 'react'

import { addFilament } from '@/app/dashboard/[brand]/production/actions'
import { editFilament } from '@/app/dashboard/[brand]/production/inventory/filament-row-actions'
import { setInventoryExtras } from '@/app/dashboard/[brand]/production/inventory/inventory-columns-actions'
import { CustomFieldInputs } from '@/components/production/custom-field-inputs'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { changedCustomValues } from '@/lib/inventory-extra'
import type { Filament } from '@/lib/validators/production'

interface FilamentDraft {
  material: string
  colour: string
  hex: string
  kg: string
  reorderKg: string
  extra: Record<string, string>
}

function draftOf(filament?: Filament): FilamentDraft {
  return {
    material: filament?.material ?? 'PLA',
    colour: filament?.colour ?? '',
    hex: filament?.colour_hex ?? '',
    kg: filament ? String(filament.grams_available / 1000) : '',
    reorderKg: filament ? String(filament.reorder_level_grams / 1000) : '',
    extra: { ...(filament?.extra ?? {}) },
  }
}

interface FilamentRowFormProps {
  brand: string
  filament?: Filament
  onDone: () => void
}

/** The fields behind Add and Edit filament. */
export function FilamentRowForm({ brand, filament, onDone }: FilamentRowFormProps): JSX.Element {
  const router = useRouter()
  const [draft, setDraft] = useState<FilamentDraft>(() => draftOf(filament))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (patch: Partial<FilamentDraft>): void => setDraft(d => ({ ...d, ...patch }))

  async function save(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setError(null)
    setPending(true)
    const input = {
      material: draft.material.trim(),
      colour: draft.colour.trim() || undefined,
      grams_available: Number(draft.kg || 0) * 1000,
      reorder_level_grams: Number(draft.reorderKg || 0) * 1000,
    }
    const res = filament
      ? await editFilament(brand, filament.id, { ...input, colour_hex: draft.hex.trim() })
      : await addFilament(brand, input)
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not save the filament.')
      return
    }
    // The custom columns save second: they belong to the row, so a new row
    // has to exist before they can.
    const rowId = filament?.id ?? res.data?.id
    const values = changedCustomValues(filament?.extra, draft.extra)
    if (rowId && Object.keys(values).length > 0) {
      setPending(true)
      const saved = await setInventoryExtras(brand, { shelf: 'filament', rowId, values })
      setPending(false)
      if (!saved.ok) {
        setError(saved.error ?? 'The row saved, but its custom columns did not.')
        router.refresh()
        return
      }
    }
    onDone()
    router.refresh()
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <Field label="Material" htmlFor="fr-material" required>
        <Input
          id="fr-material"
          value={draft.material}
          onChange={e => set({ material: e.target.value })}
        />
      </Field>
      <Field label="Colour" htmlFor="fr-colour">
        <Input
          id="fr-colour"
          value={draft.colour}
          onChange={e => set({ colour: e.target.value })}
        />
      </Field>
      {filament ? (
        <Field
          label="Colour code"
          htmlFor="fr-hex"
          hint="Like #1A1A1A. Leave blank to work it out from the colour name."
        >
          <Input
            id="fr-hex"
            value={draft.hex}
            onChange={e => set({ hex: e.target.value })}
            placeholder="#1A1A1A"
            className="font-mono"
          />
        </Field>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Available (kg)" htmlFor="fr-kg">
          <Input
            id="fr-kg"
            type="number"
            min={0}
            step="0.01"
            value={draft.kg}
            onChange={e => set({ kg: e.target.value })}
            className="font-mono tabular-nums"
          />
        </Field>
        <Field label="Reorder at (kg)" htmlFor="fr-reorder">
          <Input
            id="fr-reorder"
            type="number"
            min={0}
            step="0.01"
            value={draft.reorderKg}
            onChange={e => set({ reorderKg: e.target.value })}
            className="font-mono tabular-nums"
          />
        </Field>
      </div>
      <CustomFieldInputs
        shelf="filament"
        values={draft.extra}
        onChange={(column, value) => set({ extra: { ...draft.extra, [column]: value } })}
        disabled={pending}
      />
      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending || draft.material.trim() === ''}>
          {pending ? 'Saving…' : filament ? 'Save changes' : 'Add filament'}
        </Button>
      </div>
    </form>
  )
}
