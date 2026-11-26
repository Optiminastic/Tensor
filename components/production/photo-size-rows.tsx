'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { JSX } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { LengthUnit } from '@/lib/validators/photo-print'

/** One size as typed: lengths as text in the chosen unit. */
export interface PhotoSizeDraft {
  width: string
  height: string
  shape: 'rect' | 'circle'
  whenField: string
  whenValue: string
}

export const EMPTY_SIZE: PhotoSizeDraft = {
  width: '',
  height: '',
  shape: 'rect',
  whenField: '',
  whenValue: '',
}

interface PhotoSizeRowsProps {
  rows: PhotoSizeDraft[]
  unit: LengthUnit
  disabled: boolean
  onChange: (rows: PhotoSizeDraft[]) => void
}

/**
 * The editable list of sizes. A row with an order field applies when the
 * order's field has that value; the row without one is the default.
 */
export function PhotoSizeRows({ rows, unit, disabled, onChange }: PhotoSizeRowsProps): JSX.Element {
  const update = (i: number, patch: Partial<PhotoSizeDraft>): void =>
    onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)))

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, i) => (
        <div
          key={i}
          className="border-border grid grid-cols-2 items-end gap-2 rounded-xl border p-3 sm:grid-cols-[repeat(5,minmax(0,1fr))_auto]"
        >
          <LabelledInput
            label={row.shape === 'circle' ? `Diameter (${unit})` : `Width (${unit})`}
            value={row.width}
            disabled={disabled}
            onChange={v => update(i, { width: v })}
            mono
          />
          <LabelledInput
            label={`Height (${unit})`}
            value={row.shape === 'circle' ? row.width : row.height}
            disabled={disabled || row.shape === 'circle'}
            onChange={v => update(i, { height: v })}
            mono
          />
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Shape</span>
            <Select
              value={row.shape}
              disabled={disabled}
              onChange={e => update(i, { shape: e.target.value === 'circle' ? 'circle' : 'rect' })}
            >
              <option value="rect">Rectangle</option>
              <option value="circle">Round</option>
            </Select>
          </label>
          <LabelledInput
            label="When order field (optional)"
            value={row.whenField}
            placeholder="photo_frames"
            disabled={disabled}
            onChange={v => update(i, { whenField: v })}
          />
          <LabelledInput
            label="is"
            value={row.whenValue}
            placeholder="3"
            disabled={disabled}
            onChange={v => update(i, { whenValue: v })}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove size ${i + 1}`}
            disabled={disabled}
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="self-start"
        disabled={disabled}
        onClick={() => onChange([...rows, EMPTY_SIZE])}
      >
        <Plus className="size-3.5" aria-hidden />
        Add size
      </Button>
    </div>
  )
}

interface LabelledInputProps {
  label: string
  value: string
  disabled: boolean
  onChange: (value: string) => void
  placeholder?: string
  mono?: boolean
}

function LabelledInput({
  label,
  value,
  disabled,
  onChange,
  placeholder,
  mono,
}: LabelledInputProps): JSX.Element {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <Input
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        inputMode={mono ? 'decimal' : undefined}
        className={mono ? 'font-mono tabular-nums' : undefined}
        onChange={e => onChange(e.target.value)}
      />
    </label>
  )
}
