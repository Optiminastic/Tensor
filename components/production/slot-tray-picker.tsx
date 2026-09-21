'use client'

import type { JSX } from 'react'

import { Select } from '@/components/ui/select'
import type { QueueSlot, QueueTray } from '@/lib/validators/batches'

interface SlotTrayPickerProps {
  /** What the plate asks for, in its own slot order. */
  slots: QueueSlot[]
  /** What the chosen printer has loaded. */
  trays: QueueTray[]
  /** The tray serving each slot, in slot order, as ams_mapping integers. */
  value: number[]
  onChange: (next: number[]) => void
}

/**
 * Binding each part of the plate to the spool that will print it.
 *
 * Tensor deliberately does not decide this. An AMS reports a colour as a bare
 * hex with no name attached, an order names one in words, and most of this
 * shop's spools are generic and appear in no catalogue - so any automatic
 * answer is a guess, and a guess here prints a plank in a colour nobody
 * ordered. The operator is standing in front of the machine and can simply see
 * which spool is which.
 *
 * What Tensor does do is make the comparison easy: the bed's swatch on the
 * left, the printer's trays on the right, and a sensible default already
 * selected so the common case is one press.
 */
export function SlotTrayPicker({
  slots,
  trays,
  value,
  onChange,
}: SlotTrayPickerProps): JSX.Element | null {
  if (slots.length === 0) return null

  function choose(slotIndex: number, amsIndex: number): void {
    const next = [...value]
    next[slotIndex] = amsIndex
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-2">
      {slots.map(slot => (
        <div key={slot.index} className="flex items-center gap-2">
          <span className="flex min-w-32 items-center gap-1.5 text-xs">
            <span
              aria-hidden
              className="border-border-strong size-3.5 shrink-0 rounded-full border"
              style={{ backgroundColor: slot.hex }}
            />
            <span className="truncate">{slot.name || slot.hex}</span>
          </span>
          <span aria-hidden className="text-subtle-foreground">
            →
          </span>
          <Select
            value={String(value[slot.index] ?? '')}
            onChange={e => choose(slot.index, Number(e.target.value))}
            aria-label={`Spool for ${slot.name || slot.hex}`}
            className="flex-1"
          >
            <option value="">Pick a spool</option>
            {trays.map(tray => (
              <option key={trayKey(tray)} value={amsIndexOf(tray)}>
                {trayLabel(tray)}
              </option>
            ))}
          </Select>
        </div>
      ))}
    </div>
  )
}

/**
 * The ams_mapping integer for a tray: its AMS unit times four, plus its slot.
 *
 * Confirmed against BambuBuddy's own queue items - an A2L reporting AMS 6 slot
 * 1 is mapped as 25 - rather than assumed.
 */
function amsIndexOf(tray: QueueTray): number {
  if (typeof tray.ams_id !== 'number' || typeof tray.tray_id !== 'number') return -1
  return tray.ams_id * 4 + tray.tray_id
}

function trayKey(tray: QueueTray): string {
  return `${tray.ams_id ?? 'x'}-${tray.tray_id ?? 'x'}-${tray.hex}`
}

/**
 * A tray, named the way the machine names it.
 *
 * The label comes from the backend, which can see every unit on the printer and
 * numbers them by position - an AMS reports an id of its own choosing, so "+1"
 * on the raw id would send somebody looking for AMS 7 on a single-unit machine.
 * With no label the colour stands in, because a wrong slot number is worse than
 * none.
 */
function trayLabel(tray: QueueTray): string {
  return tray.label ? `${tray.label} — ${tray.hex}` : tray.hex
}
