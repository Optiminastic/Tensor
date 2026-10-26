'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useState, type JSX } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

/** The sentinel for "this piece takes the colour the customer chose". */
export const FOLLOWS_CUSTOMER = ''

/**
 * The colours the shop prints in, by name.
 *
 * NAMES, not hexes, because a name is resolved against this shop's own spools
 * on the way in - the operator-confirmed colour map first, then the filament
 * shelf. Offering a hex picker instead would write the catalogue's idea of gold
 * into the model, and the catalogue is exactly what these printers disagree
 * with.
 *
 * The swatch beside each is only so the list is readable; it is not what gets
 * stored.
 */
const PALETTE: ReadonlyArray<{ name: string; swatch: string }> = [
  { name: 'white', swatch: '#FFFFFF' },
  { name: 'ivory', swatch: '#FFFFF0' },
  { name: 'gold', swatch: '#D4AF37' },
  { name: 'yellow', swatch: '#FFD400' },
  { name: 'orange', swatch: '#FF7518' },
  { name: 'red', swatch: '#E4002B' },
  { name: 'pink', swatch: '#FF69B4' },
  { name: 'baby pink', swatch: '#F4C2C2' },
  { name: 'purple', swatch: '#7D3CB5' },
  { name: 'blue', swatch: '#1560BD' },
  { name: 'green', swatch: '#2E9B3F' },
  { name: 'brown', swatch: '#8B4513' },
  { name: 'silver', swatch: '#C0C0C0' },
  { name: 'grey', swatch: '#808080' },
  { name: 'black', swatch: '#1A1A1A' },
]

export interface SchemeRow {
  partName: string
  /** A palette name, or "" for the customer's chosen colour. */
  colourName: string
}

interface ColourSchemeEditorProps {
  rows: SchemeRow[]
  disabled: boolean
  onChange: (rows: SchemeRow[]) => void
}

/** True for a value this editor cannot name - a stored hex off the palette. */
export function isRawHex(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value)
}

function swatchFor(colourName: string): string {
  if (isRawHex(colourName)) return colourName
  const found = PALETTE.find(p => p.name === colourName)
  if (found) return found.swatch
  // The customer's colour is not one colour, so it is drawn as none rather
  // than as a guess at what they might pick.
  return 'repeating-linear-gradient(45deg,#bbb,#bbb 3px,#eee 3px,#eee 6px)'
}

/**
 * One design file's pieces and their colours, typed out.
 *
 * The piece name is the `PART=` value the template branches on, so it is a free
 * text box rather than a list: only the .scad knows what it draws, and a
 * dropdown built from guesses would be wrong for every new product.
 */
export function ColourSchemeEditor({
  rows,
  disabled,
  onChange,
}: ColourSchemeEditorProps): JSX.Element {
  function update(index: number, patch: Partial<SchemeRow>): void {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="divide-border/70 divide-y">
        {rows.map((row, i) => (
          <li key={i} className="flex flex-wrap items-center gap-2 py-2">
            <span
              aria-hidden
              className="border-border size-4 shrink-0 rounded border"
              style={{ background: swatchFor(row.colourName) }}
            />
            <Input
              value={row.partName}
              disabled={disabled}
              aria-label="Piece name"
              placeholder="PART name, e.g. text"
              className="w-44 font-mono text-sm"
              onChange={e => update(i, { partName: e.target.value })}
            />
            <Select
              value={row.colourName}
              disabled={disabled}
              aria-label="Colour"
              className="w-56"
              onChange={e => update(i, { colourName: e.target.value })}
            >
              <option value={FOLLOWS_CUSTOMER}>The colour the customer chose</option>
              {PALETTE.map(p => (
                <option key={p.name} value={p.name}>
                  Always {p.name}
                </option>
              ))}
              {/* A colour already stored that this palette has no word for -
                  read from a reference 3MF, most likely. Offered so opening
                  the editor and saving does not silently repaint it. */}
              {isRawHex(row.colourName) ? (
                <option value={row.colourName}>Always {row.colourName}</option>
              ) : null}
            </Select>
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              aria-label={`Remove ${row.partName || 'this piece'}`}
              onClick={() => onChange(rows.filter((_, j) => j !== i))}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </li>
        ))}
      </ul>

      <div>
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => onChange([...rows, { partName: '', colourName: FOLLOWS_CUSTOMER }])}
        >
          <Plus className="size-4" aria-hidden />
          Add a piece
        </Button>
      </div>
    </div>
  )
}
