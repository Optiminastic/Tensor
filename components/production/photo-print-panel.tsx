'use client'

import { Download, FileUp, Save, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type JSX } from 'react'

import {
  deletePhotoSampleAction,
  loadPhotoPrintAction,
  savePhotoSizesAction,
  uploadPhotoSampleAction,
} from '@/app/dashboard/[brand]/production/photo-print-actions'
import { PhotoSizeRows, type PhotoSizeDraft } from '@/components/production/photo-size-rows'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import {
  describeSize,
  fromMillimetres,
  type LengthUnit,
  type PhotoPrint,
  type PhotoSize,
  toMillimetres,
} from '@/lib/validators/photo-print'

interface PhotoPrintPanelProps {
  productCode: string
}

/**
 * Photo print size: what size this product's customer photo prints at on the
 * Custom Photo A4 sheets, and a sample PDF showing it at that size.
 *
 * OPTIONAL. Most products carry no photo and leave this empty. One that does
 * and has nothing set here prints at Tensor's built-in size, shown below, so
 * nobody has to guess what will come out.
 */
export function PhotoPrintPanel({ productCode }: PhotoPrintPanelProps): JSX.Element {
  const [data, setData] = useState<PhotoPrint | null>(null)
  const [rows, setRows] = useState<PhotoSizeDraft[]>([])
  const [unit, setUnit] = useState<LengthUnit>('mm')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  function apply(next: PhotoPrint): void {
    setData(next)
    setRows(next.sizes.map(s => toDraft(s, unit)))
  }

  useEffect(() => {
    void loadPhotoPrintAction(productCode).then(res => {
      if (res.ok && res.data) apply(res.data)
      else setMessage({ ok: false, text: res.error ?? 'Could not load the photo print size.' })
    })
    // apply reads the unit at load time only, which is the intent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productCode])

  function changeUnit(next: LengthUnit): void {
    setRows(rows.map(r => convertDraft(r, unit, next)))
    setUnit(next)
  }

  async function run(
    action: () => ReturnType<typeof savePhotoSizesAction>,
    done: string,
  ): Promise<void> {
    setBusy(true)
    setMessage(null)
    const res = await action()
    setBusy(false)
    if (res.ok && res.data) {
      apply(res.data)
      setMessage({ ok: true, text: done })
    } else {
      setMessage({ ok: false, text: res.error ?? 'That did not work.' })
    }
  }

  function save(): void {
    const sizes = rows.map(r => fromDraft(r, unit))
    const bad = sizes.findIndex(s => s === null)
    if (bad >= 0) {
      setMessage({ ok: false, text: `Size ${bad + 1}: give the width and height as numbers.` })
      return
    }
    void run(() => savePhotoSizesAction(productCode, sizes as PhotoSize[]), 'Photo sizes saved.')
  }

  if (!data) {
    return <p className="text-muted-foreground text-sm">{message?.text ?? 'Loading…'}</p>
  }
  return (
    <div className="flex flex-col gap-4 text-sm">
      <p className="text-muted-foreground">
        Optional — only for products whose orders carry a customer photo. Sets the size the photo
        prints at on the Custom Photo A4 sheets (Product Creation).
      </p>
      <BuiltInNote data={data} />
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs">Enter sizes in</span>
        <Select
          value={unit}
          onChange={e => changeUnit(e.target.value === 'cm' ? 'cm' : 'mm')}
          className="w-24"
          aria-label="Unit"
        >
          <option value="mm">mm</option>
          <option value="cm">cm</option>
        </Select>
      </div>
      <PhotoSizeRows rows={rows} unit={unit} disabled={busy} onChange={setRows} />
      <Button type="button" size="sm" className="self-start" disabled={busy} onClick={save}>
        <Save className="size-3.5" aria-hidden />
        {rows.length === 0 && data.sizes.length > 0 ? 'Clear sizes' : 'Save sizes'}
      </Button>
      <SampleSection
        productCode={productCode}
        data={data}
        busy={busy}
        onUpload={form =>
          void run(() => uploadPhotoSampleAction(productCode, form), 'Sample PDF uploaded.')
        }
        onRemove={() => void run(() => deletePhotoSampleAction(productCode), 'Sample PDF removed.')}
      />
      {message ? (
        <p
          role={message.ok ? 'status' : 'alert'}
          className={message.ok ? 'text-success' : 'text-danger'}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  )
}

function BuiltInNote({ data }: { data: PhotoPrint }): JSX.Element | null {
  if (data.sizes.length > 0 || data.built_in.length === 0) return null
  return (
    <div className="bg-surface-muted rounded-xl px-3 py-2">
      <p>Nothing set here, so Tensor prints this product&rsquo;s photo at its built-in size:</p>
      <ul className="mt-1 list-disc pl-5">
        {data.built_in.map((s, i) => (
          <li key={i}>
            <span className="font-mono tabular-nums">{describeSize(s)}</span>
            {s.when_field ? ` when ${s.when_field} is ${s.when_value}` : ' (default)'}
          </li>
        ))}
      </ul>
    </div>
  )
}

interface SampleSectionProps {
  productCode: string
  data: PhotoPrint
  busy: boolean
  onUpload: (form: FormData) => void
  onRemove: () => void
}

/** The sample PDF: the photo at its exact size on A4, kept for reference. */
function SampleSection({
  productCode,
  data,
  busy,
  onUpload,
  onRemove,
}: SampleSectionProps): JSX.Element {
  const input = useRef<HTMLInputElement>(null)
  const pick = (files: FileList | null): void => {
    const file = files?.[0]
    if (!file) return
    const form = new FormData()
    form.set('file', file)
    onUpload(form)
    if (input.current) input.current.value = ''
  }
  return (
    <div className="border-border flex flex-col gap-2 border-t pt-3">
      <p className="font-medium">Sample PDF (optional)</p>
      {data.sample ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-mono text-xs" title={data.sample.filename}>
            {data.sample.filename}
          </span>
          <a
            href={`/api/registry/products/${encodeURIComponent(productCode)}/photo-sample`}
            className="contents"
          >
            <Button type="button" variant="secondary" size="sm">
              <Download className="size-3.5" aria-hidden /> Download
            </Button>
          </a>
          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={onRemove}>
            <Trash2 className="size-3.5" aria-hidden /> Remove
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">
          The photo at its exact size on an A4 page, for whoever sets the sizes and prints the
          sheets.
        </p>
      )}
      <input
        ref={input}
        type="file"
        accept=".pdf,application/pdf"
        hidden
        onChange={e => pick(e.target.files)}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="self-start"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        <FileUp className="size-3.5" aria-hidden />
        {data.sample ? 'Replace sample PDF' : 'Upload sample PDF'}
      </Button>
    </div>
  )
}

function toDraft(s: PhotoSize, unit: LengthUnit): PhotoSizeDraft {
  return {
    width: fromMillimetres(s.width_mm, unit),
    height: fromMillimetres(s.height_mm, unit),
    shape: s.shape,
    whenField: s.when_field,
    whenValue: s.when_value,
  }
}

function fromDraft(d: PhotoSizeDraft, unit: LengthUnit): PhotoSize | null {
  const w = toMillimetres(d.width, unit)
  const h = d.shape === 'circle' ? w : toMillimetres(d.height, unit)
  if (w === null || h === null) return null
  return {
    width_mm: w,
    height_mm: h,
    shape: d.shape,
    when_field: d.whenField.trim(),
    when_value: d.whenValue.trim(),
  }
}

/** Re-expresses typed lengths in another unit; text that is not a number is kept. */
function convertDraft(d: PhotoSizeDraft, from: LengthUnit, to: LengthUnit): PhotoSizeDraft {
  const conv = (v: string): string => {
    const mm = toMillimetres(v, from)
    return mm === null ? v : fromMillimetres(mm, to)
  }
  return { ...d, width: conv(d.width), height: conv(d.height) }
}
