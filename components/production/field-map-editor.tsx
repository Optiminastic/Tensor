'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useState, type JSX } from 'react'

import { saveFieldMaps } from '@/app/dashboard/[brand]/production/design-fields-actions'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import type {
  FieldMap,
  FieldMapWriteInput,
  ObservedProperty,
  TemplateParam,
} from '@/lib/validators/registry'

interface FieldMapEditorProps {
  brand: string
  productCode: string
  /** Which of the product's design files this mapping feeds. */
  role: string
  properties: ObservedProperty[]
  params: TemplateParam[]
  maps: FieldMap[]
  /** Called after a save, so the parts list can re-read what is configured. */
  onSaved: () => void
}

const FIGURE = 'font-mono tabular-nums'

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
  onSaved,
}: FieldMapEditorProps): JSX.Element {
  const [rows, setRows] = useState<FieldMapWriteInput[]>(() =>
    maps.map(m => ({
      property_key: m.property_key,
      scad_variable: m.scad_variable,
      value_type: m.value_type,
      optional: !m.required,
    })),
  )
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function edit(index: number, patch: Partial<FieldMapWriteInput>): void {
    setSaved(false)
    setRows(current => current.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function add(): void {
    setSaved(false)
    setRows(current => [
      ...current,
      { property_key: '', scad_variable: '', value_type: 'string' as const, optional: false },
    ])
  }

  async function save(): Promise<void> {
    setError(null)
    setPending(true)
    const res = await saveFieldMaps(brand, productCode, { role, maps: rows })
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not save the mapped fields.')
      return
    }
    setSaved(true)
    onSaved()
  }

  const incomplete = rows.some(r => r.property_key === '' || r.scad_variable === '')

  return (
    <div className="flex flex-col gap-3">
      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nothing is mapped yet, so this product renders from its template&rsquo;s defaults — the
          same model for every order.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row, index) => (
            <li key={index} className="flex flex-wrap items-end gap-2">
              <label className="flex min-w-48 flex-1 flex-col gap-1">
                <span className="text-muted-foreground text-xs">Order field</span>
                <Select
                  value={row.property_key}
                  onChange={e => edit(index, { property_key: e.target.value })}
                >
                  <option value="">Choose…</option>
                  {/* The saved key is offered even when no recent order carried
                      it. A mapping written before a quiet week would otherwise
                      vanish from its own editor and be silently dropped on the
                      next save. */}
                  {optionKeys(properties, row.property_key).map(key => (
                    <option key={key} value={key}>
                      {labelFor(properties, key)}
                    </option>
                  ))}
                </Select>
              </label>

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
                </Select>
              </label>

              {/* Required holds the job when an order does not answer. Right
                  for a plank, where a blank name is scrap; wrong for a rose
                  the customer chose not to name — two of the seven combos on
                  record carry no rose name at all. */}
              <label className="flex w-32 flex-col gap-1">
                <span className="text-muted-foreground text-xs">If not answered</span>
                <Select
                  value={row.optional === true ? 'optional' : 'required'}
                  onChange={e => edit(index, { optional: e.target.value === 'optional' })}
                >
                  <option value="required">Hold the job</option>
                  <option value="optional">Leave it out</option>
                </Select>
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

      {rows.length > 0 ? <SampleHint properties={properties} rows={rows} /> : null}

      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
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

/** The observed keys, plus whatever this row already holds. */
function optionKeys(properties: ObservedProperty[], current: string): string[] {
  const keys = properties.map(p => p.key)
  return current !== '' && !keys.includes(current) ? [...keys, current] : keys
}

function labelFor(properties: ObservedProperty[], key: string): string {
  const found = properties.find(p => p.key === key)
  if (!found) return `${key} (not seen recently)`
  return `${found.label} · ${found.orders} order${found.orders === 1 ? '' : 's'}`
}

/** The template's variables, plus whatever this row already holds. */
function variableNames(params: TemplateParam[], current: string): string[] {
  const names = params.map(p => p.name)
  return current !== '' && !names.includes(current) ? [...names, current] : names
}
