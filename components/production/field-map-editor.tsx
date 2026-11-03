'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useState, type JSX } from 'react'

import { saveFieldMaps } from '@/app/dashboard/[brand]/production/design-fields-actions'
import { FieldMapPropertyCell } from '@/components/production/field-map-property-cell'
import { FieldSuggestButton } from '@/components/production/field-suggest-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type {
  FieldMap,
  FieldMapWriteInput,
  ObservedProperty,
  TemplateParam,
} from '@/lib/validators/registry'
import type { FieldSuggestion } from '@/lib/validators/registry-suggest'

interface FieldMapEditorProps {
  brand: string
  productCode: string
  /** Which of the product's design files this mapping feeds. */
  role: string
  properties: ObservedProperty[]
  params: TemplateParam[]
  maps: FieldMap[]
  /** One colourway's own file, when this part keeps a file per child SKU.
   *  Those files declare their own variables, so a proposal has to read the
   *  one this mapping will actually drive. */
  sku?: string
  /** Called after a save, so the parts list can re-read what is configured. */
  onSaved: () => void
  /**
   * Where the mapping is written. The product's, when omitted.
   *
   * ONLY THE TARGET IS SUBSTITUTABLE, never the rules: the five refusals this
   * editor enforces are what make a mapping renderable, and a second editor
   * for one SKU would be a second set of them to keep in step. So a per-SKU
   * mapping reuses this whole component and changes only where it lands.
   */
  onSave?: (maps: FieldMapWriteInput[]) => Promise<{ ok: boolean; error?: string }>
}

const FIGURE = 'font-mono tabular-nums'

/** A row carries a value rather than reading one from the order. */
function isFixed(row: FieldMapWriteInput): boolean {
  return (row.fixed_value ?? '') !== ''
}

/**
 * Which order field feeds which OpenSCAD variable.
 *
 * Both sides are dropdowns rather than text, and neither is a convenience.
 * The storefront's "STEP 4-First Name-:" normalises to "step 4 first name",
 * and a key typed one character wrong matches nothing in a way that looks
 * exactly like an order with no personalisation at all. On the right, OpenSCAD
 * accepts a `-D` naming a variable the script never reads: a mapping written
 * to NAME_1 instead of NAME_L renders a plank with the name missing, exits 0,
 * and nothing downstream can tell that from a customer who left it blank.
 *
 * Edited as a list and saved whole, the way a bill of materials is. A
 * half-applied edit that left a product mapping a first name and not a second
 * would hold every order it touched, and the failure would arrive hours later
 * on the issues board rather than in front of the person who caused it.
 */
export function FieldMapEditor({
  brand,
  productCode,
  role,
  properties,
  params,
  maps,
  sku,
  onSaved,
  onSave,
}: FieldMapEditorProps): JSX.Element {
  const [rows, setRows] = useState<FieldMapWriteInput[]>(() =>
    maps.map(m => ({
      property_key: m.property_key,
      scad_variable: m.scad_variable,
      value_type: m.value_type,
      optional: !m.required,
      fixed_value: m.fixed_value ?? '',
      default_value: m.default_value ?? '',
      max_runes: m.max_runes ?? undefined,
    })),
  )
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  // Why each proposed row was proposed, kept beside the form rather than
  // inside it: the reviewer needs it once, while reading, and it is not part
  // of what gets saved. Cleared by the first hand edit, because after that
  // the reasons no longer describe the rows on screen.
  const [reasons, setReasons] = useState<FieldSuggestion[]>([])

  function edit(index: number, patch: Partial<FieldMapWriteInput>): void {
    setSaved(false)
    setReasons([])
    setRows(current => current.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function add(): void {
    setSaved(false)
    setRows(current => [
      ...current,
      {
        property_key: '',
        scad_variable: '',
        value_type: 'string' as const,
        optional: false,
        fixed_value: '',
        default_value: '',
        max_runes: undefined,
      },
    ])
  }

  async function save(): Promise<void> {
    setError(null)
    setPending(true)
    const mapped = rows.map(r => ({
      ...r,
      fixed_value: (r.fixed_value ?? '').trim(),
      // Only an optional field can reach its default, and the API refuses a
      // default on a required one. Cleared here rather than refused, so
      // flipping a row back to "hold the job" is not a dead end.
      default_value: r.optional === true ? (r.default_value ?? '').trim() : '',
      // A fixed value is written here, not typed by a customer, so there is
      // no form to enforce a limit in and the API refuses the pair. Cleared
      // rather than refused, for the same reason as the default above.
      max_runes: isFixed(r) ? undefined : r.max_runes,
    }))
    const res = onSave
      ? await onSave(mapped)
      : await saveFieldMaps(brand, productCode, { role, maps: mapped })
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not save the mapped fields.')
      return
    }
    setSaved(true)
    setReasons([])
    onSaved()
  }

  const incomplete = rows.some(
    r => r.scad_variable === '' || (r.property_key === '' && (r.fixed_value ?? '').trim() === ''),
  )

  return (
    <div className="flex flex-col gap-3">
      <FieldSuggestButton
        brand={brand}
        productCode={productCode}
        role={role}
        sku={sku}
        hasRows={rows.length > 0}
        onSuggested={(proposed, notes) => {
          setSaved(false)
          setError(null)
          setRows(proposed)
          setReasons(notes)
        }}
      />

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nothing is mapped yet, so this product renders from its template&rsquo;s defaults — the
          same model for every order.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row, index) => (
            <li key={index} className="flex flex-wrap items-end gap-2">
              {/* Three ways a variable gets its value - a field the customers
                  have sent, a fixed value, or a key typed by hand for a
                  product that has not sold yet. See
                  field-map-property-cell.tsx, which also keeps a saved key
                  showing when no recent order carried it: a mapping written
                  before a quiet week would otherwise vanish from its own
                  editor and be silently dropped on the next save. */}
              <FieldMapPropertyCell
                properties={properties}
                row={{ property_key: row.property_key, fixed_value: row.fixed_value ?? '' }}
                onChange={patch => edit(index, patch)}
              />

              <label className="flex min-w-40 flex-1 flex-col gap-1">
                <span className="text-muted-foreground text-xs">Fills variable</span>
                <Select
                  value={row.scad_variable}
                  onChange={e => edit(index, { scad_variable: e.target.value })}
                >
                  <option value="">Choose…</option>
                  {variableNames(params, row.scad_variable).map(name => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="flex w-28 flex-col gap-1">
                <span className="text-muted-foreground text-xs">As</span>
                <Select
                  value={row.value_type}
                  onChange={e =>
                    edit(index, { value_type: e.target.value as FieldMapWriteInput['value_type'] })
                  }
                >
                  <option value="string">Text</option>
                  <option value="number">Number</option>
                  {/* The storefront sells "1 RED HEART", not "1". Count reads
                      the number out of that wording, and out of "NO HEART",
                      so an option the shop renames keeps working. */}
                  <option value="count">Count in words</option>
                </Select>
              </label>

              {/* Required holds the job when an order does not answer. Right
                  for a plank, where a blank name is scrap; wrong for a rose
                  the customer chose not to name — two of the seven combos on
                  record carry no rose name at all. */}
              <label className="flex w-32 flex-col gap-1">
                <span className="text-muted-foreground text-xs">If not answered</span>
                {/* A fixed value is always there, so there is nothing to
                    decide - disabled rather than hidden, so the columns stay
                    aligned down the list. */}
                <Select
                  value={
                    isFixed(row) ? 'required' : row.optional === true ? 'optional' : 'required'
                  }
                  disabled={isFixed(row)}
                  onChange={e => edit(index, { optional: e.target.value === 'optional' })}
                >
                  <option value="required">{isFixed(row) ? 'always set' : 'Hold the job'}</option>
                  <option value="optional">Leave it out</option>
                </Select>
              </label>

              {/* What an unanswered optional field passes instead.
                  Without it the template's own default stands, which is right
                  for a rose nobody named and wrong for a heart count: the
                  2-STEP plank sells no heart option at all, and the joinery
                  template defaults side_hearts to 1. */}
              <label className="flex w-28 flex-col gap-1">
                <span className="text-muted-foreground text-xs">Use instead</span>
                <Input
                  value={row.default_value ?? ''}
                  disabled={isFixed(row) || row.optional !== true}
                  placeholder={row.optional === true ? "template's own" : '—'}
                  onChange={e => edit(index, { default_value: e.target.value })}
                />
              </label>

              {/* How many characters the design's text box fits.
                  SAVED WITH THE REST because the backend clears the mapping
                  and writes it again: before this control existed the limit
                  could only be set in SQL, and every save made from this page
                  deleted it. Blank means no limit, which is what the column
                  holds for a product whose design does not state one. */}
              <label className="flex w-28 flex-col gap-1">
                <span className="text-muted-foreground text-xs">Max characters</span>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  inputMode="numeric"
                  className="font-mono tabular-nums"
                  value={row.max_runes ?? ''}
                  disabled={isFixed(row)}
                  placeholder={isFixed(row) ? '—' : 'no limit'}
                  onChange={e => {
                    const raw = e.target.value.trim()
                    const n = Number(raw)
                    edit(index, {
                      max_runes: raw === '' || !Number.isFinite(n) ? undefined : Math.trunc(n),
                    })
                  }}
                />
              </label>

              <Button
                variant="ghost"
                size="sm"
                aria-label={`Remove row ${index + 1}`}
                onClick={() => {
                  setSaved(false)
                  setRows(current => current.filter((_, i) => i !== index))
                }}
              >
                <Trash2 className="size-3.5" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {reasons.length > 0 ? <WhyEachRow reasons={reasons} /> : null}

      {rows.length > 0 ? <SampleHint properties={properties} rows={rows} /> : null}

      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={add}>
          <Plus className="size-3.5" aria-hidden />
          Map a field
        </Button>
        <Button size="sm" onClick={() => void save()} disabled={pending || incomplete}>
          {pending ? 'Saving…' : 'Save mapping'}
        </Button>
        {saved ? (
          <span role="status" className="text-muted-foreground text-xs">
            Saved. Models rendered from now on use it.
          </span>
        ) : null}
        {incomplete ? (
          <span className="text-muted-foreground text-xs">
            Every row needs both sides — a half-written row would hold the order.
          </span>
        ) : null}
      </div>
    </div>
  )
}

/**
 * One real answer per mapped field.
 *
 * "Text" or "Number" is a choice with consequences - a string reaches OpenSCAD
 * quoted and a number bare - and the fastest way to get it right is to see
 * what a customer actually sent.
 */
function SampleHint({
  properties,
  rows,
}: {
  properties: ObservedProperty[]
  rows: FieldMapWriteInput[]
}): JSX.Element | null {
  const samples = rows
    .map(row => properties.find(p => p.key === row.property_key))
    .filter((p): p is ObservedProperty => p !== undefined && p.sample !== '')
  if (samples.length === 0) return null

  return (
    <p className="text-subtle-foreground text-xs">
      Recent answers:{' '}
      {samples.map((p, i) => (
        <span key={p.key}>
          {i > 0 ? ' · ' : ''}
          {p.label} <span className={FIGURE}>&ldquo;{p.sample}&rdquo;</span>
        </span>
      ))}
    </p>
  )
}

/** The template's variables, plus whatever this row already holds. */
function variableNames(params: TemplateParam[], current: string): string[] {
  const names = params.map(p => p.name)
  return current !== '' && !names.includes(current) ? [...names, current] : names
}

/**
 * Why each proposed row was proposed.
 *
 * Beside the form rather than inside it: the reviewer needs this once, while
 * deciding whether to save, and it is not part of what gets saved.
 *
 * The two sources read differently and are marked differently. "The design
 * names this field" is the author's own word and needs a glance; "matched on
 * wording" is Tensor pairing two names and needs reading. Presenting them
 * identically would be the one way this feature could do harm - somebody
 * saving a guess because it looked as settled as a fact.
 */
function WhyEachRow({ reasons }: { reasons: FieldSuggestion[] }): JSX.Element {
  return (
    <div className="border-border bg-surface-muted flex flex-col gap-1.5 rounded-2xl border px-4 py-3">
      <p className="text-muted-foreground text-xs">
        Proposed from the design and this product&rsquo;s recent orders. Read it, then save.
      </p>
      <ul className="flex flex-col gap-1">
        {reasons.map(r => (
          <li key={r.scad_variable} className="text-subtle-foreground text-xs">
            <span className="font-mono">{r.scad_variable}</span>
            {r.source === 'file' ? (
              <span className="text-success"> · stated in the design</span>
            ) : (
              <span className="text-warning"> · {r.strength} match</span>
            )}{' '}
            {r.why}
          </li>
        ))}
      </ul>
    </div>
  )
}
