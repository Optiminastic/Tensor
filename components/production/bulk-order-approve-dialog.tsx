'use client'

import { Download, Upload } from 'lucide-react'
import { useState, type JSX } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { BulkOrder } from '@/lib/validators/bulk-orders'

interface BulkOrderApproveDialogProps {
  brand: string
  order: BulkOrder | null
  onClose: () => void
  onApproved: () => void
}

/**
 * Approve a quotation by uploading its personalisation.
 *
 * The file goes straight to Tensor-Core rather than through a server action:
 * server actions take JSON, and a multipart upload would have to be
 * base64-encoded into one, which doubles a spreadsheet's size for no gain. The
 * route behind it is permission-guarded exactly like every other write.
 *
 * Validation is entirely the backend's. It answers with every problem it found
 * at once - sheet, row and column - and this lists them verbatim, because
 * rephrasing "Sheet SC row 14: NAME_R is empty" can only make it less useful to
 * the person holding the spreadsheet.
 */
export function BulkOrderApproveDialog({
  brand,
  order,
  onClose,
  onApproved,
}: BulkOrderApproveDialogProps): JSX.Element {
  const [file, setFile] = useState<File | null>(null)
  const [problems, setProblems] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  function reset(): void {
    setFile(null)
    setProblems([])
    setError(null)
    setResult(null)
    setBusy(false)
  }

  async function submit(): Promise<void> {
    if (!order || !file) return
    setBusy(true)
    setProblems([])
    setError(null)
    try {
      const body = new FormData()
      body.append('file', file)
      const response = await fetch(
        `/api/bulk-orders/${encodeURIComponent(brand)}/${encodeURIComponent(order.id)}/approve`,
        { method: 'POST', body },
      )
      const data: unknown = await response.json().catch(() => ({}))
      if (!response.ok) {
        const payload = data as { detail?: string; problems?: string[] }
        setProblems(payload.problems ?? [])
        setError(payload.detail ?? 'The spreadsheet was not accepted.')
        return
      }
      const payload = data as { jobs_created?: number; skipped_skus?: string[] }
      const skipped = payload.skipped_skus ?? []
      setResult(
        `${payload.jobs_created ?? 0} production job(s) created.` +
          (skipped.length > 0
            ? ` Skipped ${skipped.join(', ')} — not in the registry, so no sheet was expected.`
            : ''),
      )
      onApproved()
    } catch {
      setError('Could not reach Tensor-Core.')
    } finally {
      setBusy(false)
    }
  }

  const templateHref = order
    ? `/api/bulk-orders/${encodeURIComponent(brand)}/${encodeURIComponent(order.id)}/sheet-template`
    : '#'

  return (
    <Dialog
      open={order !== null}
      onOpenChange={open => {
        if (!open) {
          reset()
          onClose()
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Approve {order?.quotation_number}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <p className="text-muted-foreground text-sm text-pretty">
            Upload the personalisation for this order: one sheet per product, named by its code,
            with one row per unit. Tensor checks every sheet before anything is created.
          </p>

          <div className="flex flex-wrap gap-2">
            <a href={templateHref} className="contents" download>
              <Button type="button" variant="secondary" size="sm">
                <Download className="size-4" aria-hidden /> Template for this order
              </Button>
            </a>
            <a
              href={`/api/bulk-orders/${encodeURIComponent(brand)}/sample`}
              className="contents"
              download
            >
              <Button type="button" variant="ghost" size="sm">
                <Download className="size-4" aria-hidden /> Filled-in sample
              </Button>
            </a>
          </div>

          <Field label="Spreadsheet" htmlFor="bo-file" hint=".xlsx, up to 10 MB">
            <Input
              id="bo-file"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={e => {
                setFile(e.target.files?.[0] ?? null)
                setProblems([])
                setError(null)
              }}
            />
          </Field>

          {error ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
              {error}
            </p>
          ) : null}

          {problems.length > 0 ? (
            <div className="border-danger/40 max-h-64 overflow-y-auto rounded-md border">
              <ul className="divide-border divide-y text-sm">
                {problems.map(problem => (
                  <li key={problem} className="px-3 py-2">
                    {problem}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {result ? (
            <p role="status" className="bg-success/10 text-success rounded-md px-3 py-2 text-sm">
              {result}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
              {result ? 'Close' : 'Cancel'}
            </Button>
            <Button
              type="button"
              onClick={submit}
              disabled={busy || file === null || result !== null}
            >
              <Upload className="size-4" aria-hidden />
              {busy ? 'Checking…' : 'Approve and create jobs'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
