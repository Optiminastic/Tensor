'use client'

import { Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type JSX } from 'react'

import {
  clearColourPartsAction,
  loadColourParts,
  saveColourSchemeAction,
  uploadColourReferenceAction,
} from '@/app/dashboard/[brand]/production/colour-part-actions'
import {
  ColourSchemeEditor,
  FOLLOWS_CUSTOMER,
  isRawHex,
  type SchemeRow,
} from '@/components/production/colour-scheme-editor'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import type { ColourPart, RegistryVariant } from '@/lib/validators/registry'

interface ColourPartsPanelProps {
  brand: string
  productCode: string
  /** Which of the product's design files these pieces belong to. */
  role: string
  /** The colourways this product sells, so a scheme can be set per variant. */
  variants: RegistryVariant[]
}

/** The scope select's value for the product's own scheme. */
const PRODUCT_SCOPE = ''

/**
 * The coloured pieces one design file prints as.
 *
 * OpenSCAD cannot export colour - `color()` is a preview CGAL discards - so a
 * model reaches the slicer as one object per colour, and something has to say
 * what those objects are. That used to be two, hardcoded: a white base and the
 * customer's colour on the lettering.
 *
 * The reference 3MF is still the best route where one exists, because the
 * designer has already named the pieces and assigned the colours in the slicer.
 * Typing them is for the product that has no such file, and for the product
 * whose palette is designed PER COLOURWAY - a pink outline on the purple one,
 * gold on the red - which one reference file cannot state.
 */
export function ColourPartsPanel({
  brand,
  productCode,
  role,
  variants,
}: ColourPartsPanelProps): JSX.Element {
  const [parts, setParts] = useState<ColourPart[] | null>(null)
  const [scope, setScope] = useState<string>(PRODUCT_SCOPE)
  const [rows, setRows] = useState<SchemeRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const colourways = useMemo(
    () => variants.filter(v => v.sku && v.status !== 'retired'),
    [variants],
  )

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

  /** The stored pieces for the scope on screen, before any editing. */
  const stored = useMemo(() => (parts ?? []).filter(p => p.variant_sku === scope), [parts, scope])

  /**
   * What this scope falls back to when it declares nothing of its own. Shown
   * rather than left blank, because "no rows" and "the product's rows" look
   * identical on screen and mean opposite things at render time.
   */
  const inherited = useMemo(
    () => (scope === PRODUCT_SCOPE ? [] : (parts ?? []).filter(p => p.variant_sku === '')),
    [parts, scope],
  )

  const shown = stored.length > 0 ? stored : inherited
  const editing = rows !== null

  function beginEditing(): void {
    setRows(
      shown.length > 0
        ? shown.map(p => ({ partName: p.part_name, colourName: p.colour_hex || FOLLOWS_CUSTOMER }))
        : [{ partName: '', colourName: FOLLOWS_CUSTOMER }],
    )
  }

  async function save(): Promise<void> {
    if (!rows) return
    const cleaned = rows
      .map(r => ({ ...r, partName: r.partName.trim() }))
      .filter(r => r.partName !== '')
    if (cleaned.length === 0) {
      setError('Name at least one piece, as the template spells it.')
      return
    }
    setBusy(true)
    setError(null)
    const res = await saveColourSchemeAction(
      { brand, code: productCode, role },
      {
        variant_sku: scope,
        // A palette name is sent as a NAME so the backend resolves it against
        // this shop's spools. A hex only survives here when it came from a
        // reference 3MF and the palette has no word for it.
        parts: cleaned.map(r => ({
          part_name: r.partName,
          colour_hex: isRawHex(r.colourName) ? r.colourName : '',
          ...(isRawHex(r.colourName) || r.colourName === FOLLOWS_CUSTOMER
            ? {}
            : { colour_name: r.colourName }),
        })),
      },
    )
    setBusy(false)
    if (!res.ok || !res.data) {
      setError(res.error ?? 'Could not save the colour scheme.')
      return
    }
    // Replaces this scope's rows and leaves every other scope alone, which is
    // what the backend did too.
    const saved = res.data
    setParts(current => [...(current ?? []).filter(p => p.variant_sku !== scope), ...saved])
    setRows(null)
  }

  async function reset(): Promise<void> {
    setBusy(true)
    setError(null)
    const res = await clearColourPartsAction({
      brand,
      code: productCode,
      role,
      variantSKU: scope === PRODUCT_SCOPE ? undefined : scope,
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not clear the pieces.')
      return
    }
    setParts(current => (current ?? []).filter(p => p.variant_sku !== scope))
    setRows(null)
  }

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
    // A reference 3MF describes the design file, so it writes the PRODUCT's
    // scheme. Any per-variant overrides stand, and still win.
    const saved = res.data
    setParts(current => [...(current ?? []).filter(p => p.variant_sku !== ''), ...saved])
    setRows(null)
    setScope(PRODUCT_SCOPE)
  }

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h4 className="text-foreground text-sm font-medium">Colours</h4>
        <p className="text-muted-foreground text-sm">
          Which pieces this file prints as, and what colour each one is.
        </p>
      </div>

      {colourways.length > 0 ? (
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Colourway</span>
          <Select
            value={scope}
            disabled={busy}
            className="w-72"
            onChange={e => {
              setScope(e.target.value)
              setRows(null)
              setError(null)
            }}
          >
            <option value={PRODUCT_SCOPE}>Every variant — the product&rsquo;s own scheme</option>
            {colourways.map(v => (
              <option key={v.id} value={v.sku ?? ''}>
                {v.name} · {v.sku}
              </option>
            ))}
          </Select>
        </label>
      ) : null}

      {parts === null ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : editing ? (
        <ColourSchemeEditor rows={rows} disabled={busy} onChange={setRows} />
      ) : shown.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Not set, so this file prints the default pair: a white base from{' '}
          <code className="font-mono text-xs">PART=&quot;base&quot;</code> and the customer&apos;s
          colour from <code className="font-mono text-xs">PART=&quot;text&quot;</code>.
        </p>
      ) : (
        <>
          {stored.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Following the product&rsquo;s scheme. Edit to give this colourway one of its own.
            </p>
          ) : null}
          <ul className="divide-border/70 divide-y">
            {shown.map(part => (
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
                <span className="text-muted-foreground ml-auto text-sm">
                  {part.colour_hex ? `Always ${part.colour_hex}` : 'The colour the customer chose'}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {editing ? (
          <>
            <Button size="sm" disabled={busy} onClick={() => void save()}>
              Save scheme
            </Button>
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => setRows(null)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            disabled={busy || parts === null}
            onClick={beginEditing}
          >
            {shown.length > 0 ? 'Edit pieces' : 'Name the pieces'}
          </Button>
        )}

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
        {scope === PRODUCT_SCOPE && !editing ? (
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => fileInput.current?.click()}
          >
            <Upload className="size-4" aria-hidden />
            {shown.length > 0 ? 'Replace reference 3MF' : 'Upload reference 3MF'}
          </Button>
        ) : null}

        {stored.length > 0 && !editing ? (
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => void reset()}>
            {scope === PRODUCT_SCOPE ? 'Use the default pair' : 'Follow the product again'}
          </Button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}
    </section>
  )
}
