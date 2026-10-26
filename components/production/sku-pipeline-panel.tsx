'use client'

import { useCallback, useEffect, useState, type JSX } from 'react'

import {
  loadPipelineTargets,
  saveSKUPipelinesAction,
} from '@/app/dashboard/[brand]/production/sku-pipeline-actions'
import { Select } from '@/components/ui/select'
import type { PipelineOption, PipelineTarget, PipelineTargets } from '@/lib/validators/registry'

interface SKUPipelinePanelProps {
  brand: string
}

/** The select's value for "no mapping": the machine class's own default. */
const CLASS_DEFAULT = ''

/**
 * Which slicer settings each product prints with.
 *
 * ASSIGNED TO THE PRODUCT, not the SKU. The Lotus sells in three colourways
 * and the plank will have forty-four, and every one of them prints with the
 * same settings - so a mapping per SKU is the same answer typed out once per
 * colour, and as many chances for one of them to drift.
 *
 * Underneath, a SKU may still carry its own: one colourway on a glow filament
 * can need its own profile, and the backend prefers a SKU's rule over its
 * product's. This page does not offer that yet; the rule exists so it can.
 *
 * The second table is the SKUs that belong to no registry product. They have
 * no parent to inherit from, and most of what prints today is in there -
 * listing only products would leave the busiest SKUs unmappable.
 */
export function SKUPipelinePanel({ brand }: SKUPipelinePanelProps): JSX.Element {
  const [data, setData] = useState<PipelineTargets | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<number>(0)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async (): Promise<void> => {
    const res = await loadPipelineTargets()
    if (!res.ok || !res.data) {
      setError(res.error ?? 'Could not read the products.')
      return
    }
    setData(res.data)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function set(target: PipelineTarget, family: string, raw: string): Promise<void> {
    setBusy(true)
    setError(null)
    const res = await saveSKUPipelinesAction(brand, {
      mappings: [
        {
          // The Shopify parent, which every SKU under it inherits. Exactly
          // one target: the backend refuses a mapping naming two or none.
          ...(target.shopify_product_id !== ''
            ? { shopify_product_id: target.shopify_product_id }
            : target.product_code !== ''
              ? { product_code: target.product_code }
              : { sku: target.sku }),
          machine_family: family,
          pipeline_id: raw === CLASS_DEFAULT ? 0 : Number(raw),
        },
      ],
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not save the slicing settings.')
      return
    }
    setSaved(n => n + 1)
    // Re-read rather than patching local state: what is on screen should be
    // what was stored, not what the browser hoped was stored.
    await refresh()
  }

  if (data === null && error === null) {
    return <p className="text-muted-foreground text-sm">Reading the products…</p>
  }

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      {data ? (
        <>
          <TargetTable
            title="Products"
            blurb="Set once on the product — every SKU sold under it prints the same way."
            rows={data.products}
            families={data.families}
            pipelines={data.pipelines}
            busy={busy}
            onSet={set}
          />

          {data.loose.length > 0 ? (
            <TargetTable
              title="SKUs with no product"
              blurb="These print but belong to no registry product, so there is no parent to set. Import the product and they move to the table above."
              rows={data.loose}
              families={data.families}
              pipelines={data.pipelines}
              busy={busy}
              onSet={set}
            />
          ) : null}
        </>
      ) : null}

      {saved > 0 ? (
        <p role="status" className="text-success text-sm">
          Saved.
        </p>
      ) : null}
    </div>
  )
}

interface TargetTableProps {
  title: string
  blurb: string
  rows: PipelineTarget[]
  families: string[]
  pipelines: PipelineOption[]
  busy: boolean
  onSet: (target: PipelineTarget, family: string, raw: string) => void
}

function TargetTable({
  title,
  blurb,
  rows,
  families,
  pipelines,
  busy,
  onSet,
}: TargetTableProps): JSX.Element {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-muted-foreground text-xs">{blurb}</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nothing here yet.</p>
      ) : (
        <div className="border-border max-h-[32rem] overflow-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted sticky top-0">
              <tr className="border-border border-b">
                <th className="text-muted-foreground px-3 py-2 text-left font-normal">
                  {title === 'Products' ? 'Product' : 'SKU'}
                </th>
                {families.map(f => (
                  <th
                    key={f}
                    className="text-muted-foreground px-3 py-2 text-left font-normal whitespace-nowrap"
                  >
                    {f}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr
                  key={row.shopify_product_id || row.product_code || row.sku}
                  className="border-border/70 border-b last:border-0"
                >
                  <td className="px-3 py-2">
                    <span className="font-medium">{row.name}</span>
                    {row.product_code ? (
                      <code className="text-muted-foreground ml-2 font-mono text-xs">
                        {row.product_code}
                      </code>
                    ) : null}
                    {/* How many colourways this one choice covers. The number
                        is the whole argument for setting it on the parent. */}
                    {row.sku_count > 0 ? (
                      <span className="text-subtle-foreground ml-2 font-mono text-xs tabular-nums">
                        {row.sku_count} SKU{row.sku_count === 1 ? '' : 's'}
                      </span>
                    ) : null}
                  </td>
                  {families.map(f => (
                    <td key={f} className="px-3 py-2">
                      <PipelineCell
                        choice={row.pipelines[f]}
                        family={f}
                        pipelines={pipelines}
                        busy={busy}
                        onChange={raw => onSet(row, f, raw)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

interface PipelineCellProps {
  choice: { pipeline_id: number; pipeline_name: string; missing: boolean } | undefined
  family: string
  pipelines: PipelineOption[]
  busy: boolean
  onChange: (raw: string) => void
}

function PipelineCell({
  choice,
  family,
  pipelines,
  busy,
  onChange,
}: PipelineCellProps): JSX.Element {
  // Only this class's pipelines: one targeted at another would slice every
  // plate for the wrong bed, and the backend refuses it for the same reason.
  const forFamily = pipelines.filter(
    p => p.machine_family === '' || p.machine_family.toUpperCase() === family.toUpperCase(),
  )
  const value = choice ? String(choice.pipeline_id) : CLASS_DEFAULT

  return (
    <div className="flex flex-col gap-0.5">
      <Select
        value={value}
        disabled={busy}
        aria-label={`Pipeline for ${family}`}
        className="w-48"
        onChange={e => onChange(e.target.value)}
      >
        <option value={CLASS_DEFAULT}>Class default</option>
        {forFamily.map(p => (
          <option key={p.id} value={String(p.id)}>
            {p.name}
          </option>
        ))}
        {/* A pipeline that has gone from BambuBuddy stays selectable, or the
            cell would silently read as the class default. */}
        {choice && !forFamily.some(p => p.id === choice.pipeline_id) ? (
          <option value={String(choice.pipeline_id)}>{choice.pipeline_name}</option>
        ) : null}
      </Select>
      {choice?.missing ? (
        <span className="text-danger text-xs">
          BambuBuddy no longer lists this &mdash; a bed would refuse to slice.
        </span>
      ) : null}
    </div>
  )
}
