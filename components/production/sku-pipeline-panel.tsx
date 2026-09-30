'use client'

import { Loader2, Search } from 'lucide-react'
import { useEffect, useMemo, useState, type JSX } from 'react'

import {
  loadSKUPipelines,
  saveSKUPipelinesAction,
} from '@/app/dashboard/[brand]/production/sku-pipeline-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { PipelineOption, SKUPipelineRow } from '@/lib/validators/registry'

interface SKUPipelinePanelProps {
  brand: string
}

/** The empty option: this SKU uses whatever the machine class defaults to. */
const CLASS_DEFAULT = ''

/**
 * Which slicing settings each SKU prints with, per machine class.
 *
 * Settings used to be chosen by printer model alone, so a Dual Name Plank and a
 * heart keychain sent to the same H2C were sliced identically — and with two
 * H2C pipelines on the floor, which one they got was whichever BambuBuddy
 * listed first.
 *
 * A table of every SKU rather than a control buried in each product, because
 * the job is usually "these twenty SKUs all print with DNP-H2C". Several SKUs
 * mapped to one pipeline keep sharing a plate; SKUs mapped differently stop,
 * which is the same rule colour already follows — one plate is sliced once,
 * with one process preset.
 *
 * The settings themselves stay in BambuBuddy. This names one of its pipelines;
 * it does not copy any of it.
 */
export function SKUPipelinePanel({ brand }: SKUPipelinePanelProps): JSX.Element {
  const [rows, setRows] = useState<SKUPipelineRow[]>([])
  const [pipelines, setPipelines] = useState<PipelineOption[]>([])
  const [families, setFamilies] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [chosen, setChosen] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  useEffect(() => {
    let cancelled = false
    void loadSKUPipelines().then(res => {
      if (cancelled) return
      setLoading(false)
      if (!res.ok || !res.data) {
        setError(res.error ?? 'Could not read the SKU list.')
        return
      }
      setRows(res.data.skus)
      setPipelines(res.data.pipelines)
      setFamilies(res.data.families)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (needle === '') return rows
    return rows.filter(r =>
      [r.sku, r.product_name, r.product_code].some(f => f.toLowerCase().includes(needle)),
    )
  }, [rows, query])

  async function save(mappings: { sku: string; machine_family: string; pipeline_id: number }[]) {
    setPending(true)
    setError('')
    setSaved('')
    const res = await saveSKUPipelinesAction(brand, { mappings })
    setPending(false)
    if (!res.ok || !res.data) {
      setError(res.error ?? 'Could not save the slicing settings.')
      return
    }
    // The table comes back from the server, so what is on screen is what was
    // stored rather than what the browser hoped was stored.
    setRows(res.data.skus)
    setPipelines(res.data.pipelines)
    setSaved(`Saved ${mappings.length} ${mappings.length === 1 ? 'mapping' : 'mappings'}.`)
  }

  function setOne(sku: string, family: string, raw: string): void {
    void save([
      { sku, machine_family: family, pipeline_id: raw === CLASS_DEFAULT ? 0 : Number(raw) },
    ])
  }

  function setMany(family: string, raw: string): void {
    if (chosen.length === 0) return
    void save(
      chosen.map(sku => ({
        sku,
        machine_family: family,
        pipeline_id: raw === CLASS_DEFAULT ? 0 : Number(raw),
      })),
    )
  }

  if (loading) {
    return <p className="text-muted-foreground text-sm">Reading the SKUs…</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        Which slicing settings each SKU prints with, per machine class. A SKU with no choice uses
        whatever that class defaults to. Several SKUs may share one pipeline — those keep printing
        on the same bed; SKUs set to different pipelines are batched apart, because a plate is
        sliced once with one process preset.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative flex min-w-64 flex-1 items-center">
          <Search className="text-muted-foreground absolute left-2.5 size-3.5" aria-hidden />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search a SKU or product"
            aria-label="Search SKUs"
            className="pl-8"
          />
        </label>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      </div>

      {chosen.length > 0 ? (
        <BulkBar
          count={chosen.length}
          families={families}
          pipelines={pipelines}
          onApply={setMany}
          onClear={() => setChosen([])}
        />
      ) : null}

      {error ? (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p role="status" className="text-muted-foreground text-xs">
          {saved}
        </p>
      ) : null}

      <div className="border-border max-h-[32rem] overflow-y-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted sticky top-0">
            <tr>
              <th className="w-8 p-2" />
              <th className="p-2 text-left font-medium">SKU</th>
              <th className="p-2 text-left font-medium">Product</th>
              {families.map(f => (
                <th key={f} className="p-2 text-left font-medium">
                  {f}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map(row => (
              <tr key={row.sku} className="border-border border-t">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={chosen.includes(row.sku)}
                    aria-label={`Select ${row.sku}`}
                    onChange={() =>
                      setChosen(prev =>
                        prev.includes(row.sku)
                          ? prev.filter(s => s !== row.sku)
                          : [...prev, row.sku],
                      )
                    }
                  />
                </td>
                <td className="p-2 font-mono text-xs tabular-nums">{row.sku}</td>
                <td className="text-muted-foreground max-w-64 truncate p-2 text-xs">
                  {row.product_name || row.product_code}
                </td>
                {families.map(family => (
                  <td key={family} className="p-2">
                    <PipelineCell
                      row={row}
                      family={family}
                      pipelines={pipelines}
                      disabled={pending}
                      onChange={raw => setOne(row.sku, family, raw)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 ? (
          <p className="text-muted-foreground p-4 text-center text-sm">
            No SKU matches “{query.trim()}”.
          </p>
        ) : null}
      </div>

      <p className="text-subtle-foreground text-xs">
        {shown.length} of {rows.length} SKUs. The pipelines come from BambuBuddy; the settings
        inside them are edited there.
      </p>
    </div>
  )
}

interface PipelineCellProps {
  row: SKUPipelineRow
  family: string
  pipelines: PipelineOption[]
  disabled: boolean
  onChange: (raw: string) => void
}

function PipelineCell({
  row,
  family,
  pipelines,
  disabled,
  onChange,
}: PipelineCellProps): JSX.Element {
  const current = row.pipelines[family]
  // Only this class's pipelines. A P2S pipeline filed under H2C would slice
  // every plate on the SKU for a bed the machine does not have, and the
  // backend refuses it — so it is not offered in the first place.
  const options = pipelines.filter(
    p => p.machine_family === '' || p.machine_family.toUpperCase() === family.toUpperCase(),
  )

  return (
    <div className="flex flex-col gap-1">
      <Select
        value={current ? String(current.pipeline_id) : CLASS_DEFAULT}
        disabled={disabled}
        aria-label={`${row.sku} on ${family}`}
        onChange={e => onChange(e.target.value)}
      >
        <option value={CLASS_DEFAULT}>Class default</option>
        {options.map(p => (
          <option key={p.id} value={String(p.id)}>
            {p.name}
          </option>
        ))}
        {/* A mapping whose pipeline has gone still has to be selectable, or the
            dropdown would silently show "Class default" for a SKU that is not
            on the default and cannot slice. */}
        {current && !options.some(p => p.id === current.pipeline_id) ? (
          <option value={String(current.pipeline_id)}>{current.pipeline_name}</option>
        ) : null}
      </Select>
      {current?.missing ? (
        <span className="text-danger text-xs">
          {current.pipeline_name} is gone from BambuBuddy — this bed will refuse to slice
        </span>
      ) : null}
    </div>
  )
}

interface BulkBarProps {
  count: number
  families: string[]
  pipelines: PipelineOption[]
  onApply: (family: string, raw: string) => void
  onClear: () => void
}

/**
 * Setting one pipeline on many SKUs at once — the reason this is a table.
 *
 * One save for the whole selection rather than one per row: twenty requests
 * could each fail on their own and leave the floor half-configured.
 */
function BulkBar({ count, families, pipelines, onApply, onClear }: BulkBarProps): JSX.Element {
  const [family, setFamily] = useState(families[0] ?? '')
  const options = pipelines.filter(
    p => p.machine_family === '' || p.machine_family.toUpperCase() === family.toUpperCase(),
  )

  return (
    <div className="border-border bg-surface-muted flex flex-wrap items-end gap-2 rounded-md border p-2">
      <span className="text-sm">
        {count} {count === 1 ? 'SKU' : 'SKUs'} selected — set
      </span>
      <Select
        value={family}
        onChange={e => setFamily(e.target.value)}
        aria-label="Machine class to set"
        className="w-28"
      >
        {families.map(f => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </Select>
      <span className="text-sm">to</span>
      <Select
        value={CLASS_DEFAULT}
        aria-label="Pipeline to apply"
        onChange={e => onApply(family, e.target.value)}
        className="min-w-56"
      >
        <option value={CLASS_DEFAULT}>Choose a pipeline…</option>
        {options.map(p => (
          <option key={p.id} value={String(p.id)}>
            {p.name}
          </option>
        ))}
      </Select>
      <Button type="button" variant="ghost" size="sm" onClick={onClear}>
        Clear selection
      </Button>
    </div>
  )
}
