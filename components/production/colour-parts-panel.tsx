'use client'

import { Upload } from 'lucide-react'
import { useEffect, useRef, useState, type JSX } from 'react'

import {
  clearColourPartsAction,
  loadColourParts,
  setColourPartColourAction,
  uploadColourReferenceAction,
} from '@/app/dashboard/[brand]/production/colour-part-actions'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import type { ColourPart } from '@/lib/validators/registry'

interface ColourPartsPanelProps {
  brand: string
  productCode: string
  /** Which of the product's design files these pieces belong to. */
  role: string
}

/** The sentinel for "this piece takes the colour the customer chose". */
const FOLLOWS_CUSTOMER = ''

/**
 * The coloured pieces one design file prints as.
 *
 * OpenSCAD cannot export colour - `color()` is a preview CGAL discards - so a
 * model reaches the slicer as one object per colour, and something has to say
 * what those objects are. That used to be two, hardcoded: a white base and the
 * customer's colour on the lettering.
 *
 * The reference 3MF is the answer because the designer has already built it.
 * They named the pieces and assigned the colours in the slicer; re-typing those
 * hexes into a form is both work and a chance to get one wrong.
 */
export function ColourPartsPanel({ brand, productCode, role }: ColourPartsPanelProps): JSX.Element {
  const [parts, setParts] = useState<ColourPart[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let live = true
    void loadColourParts(productCode).then(res => {
      if (!live) return
      if (res.ok && res.data) setParts(res.data.filter(p => p.role === role))
      else setError(res.error ?? 'Could not load the colour parts.')
    })
    return () => {
      live = false
    }
  }, [productCode, role])

  async function upload(file: File): Promise<void> {
    setBusy(true)
    setError(null)
    const form = new FormData()
    form.append('file', file)
    const res = await uploadColourReferenceAction({ brand, code: productCode, role }, form)
    setBusy(false)
    if (!res.ok || !res.data) {
      setError(res.error ?? 'Could not read that 3MF.')
      return
    }
    setParts(res.data)
  }

  async function recolour(part: ColourPart, hex: string): Promise<void> {
    setBusy(true)
    setError(null)
    const res = await setColourPartColourAction(brand, part.id, hex)
    setBusy(false)
    const updated = res.data
    if (!res.ok || !updated) {
      setError(res.error ?? 'Could not update that piece.')
      return
    }
    setParts(current => (current ?? []).map(p => (p.id === part.id ? updated : p)))
  }

  async function reset(): Promise<void> {
    setBusy(true)
    setError(null)
    const res = await clearColourPartsAction(brand, productCode, role)
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not clear the pieces.')
      return
    }
    setParts([])
  }

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h4 className="text-foreground text-sm font-medium">Colours</h4>
        <p className="text-muted-foreground text-sm">
          Which pieces this file prints as, and what colour each one is.
        </p>
      </div>

      {parts === null ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : parts.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Not set, so this file prints the default pair: a white base from{' '}
          <code className="font-mono text-xs">PART=&quot;base&quot;</code> and the customer&apos;s
          colour from <code className="font-mono text-xs">PART=&quot;text&quot;</code>. Upload a
          reference 3MF to name the pieces yourself.
        </p>
      ) : (
        <ul className="divide-border/70 divide-y">
          {parts.map(part => (
            <li key={part.id} className="flex flex-wrap items-center gap-3 py-2">
              <span
                aria-hidden
                className="border-border size-4 shrink-0 rounded border"
                style={{
                  background:
                    part.colour_hex ||
                    'repeating-linear-gradient(45deg,#bbb,#bbb 3px,#eee 3px,#eee 6px)',
                }}
              />
              <code className="font-mono text-sm">{part.part_name}</code>
              <Select
                value={part.colour_hex || FOLLOWS_CUSTOMER}
                disabled={busy}
                onChange={e => void recolour(part, e.target.value)}
                className="ml-auto w-56"
              >
                <option value={FOLLOWS_CUSTOMER}>The colour the customer chose</option>
                {part.colour_hex ? (
                  <option value={part.colour_hex}>Always {part.colour_hex}</option>
                ) : null}
              </Select>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInput}
          type="file"
          accept=".3mf"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) void upload(file)
            e.target.value = ''
          }}
        />
        <Button
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => fileInput.current?.click()}
        >
          <Upload className="size-4" aria-hidden />
          {parts && parts.length > 0 ? 'Replace reference 3MF' : 'Upload reference 3MF'}
        </Button>
        {parts && parts.length > 0 ? (
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => void reset()}>
            Use the default pair
          </Button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}
    </section>
  )
}
