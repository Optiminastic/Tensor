'use client'

import { Download, FileSpreadsheet, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { ImportOutcome } from '@/components/production/import-outcome'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

type ImportKind = 'filament' | 'items'

interface InventoryImportDialogProps {
  kind: ImportKind
}

interface ImportCopy {
  button: string
  title: string
  sheet: string
  columns: string
  rule: string
}

const COPY: Record<ImportKind, ImportCopy> = {
  filament: {
    button: 'Import filament',
    title: 'Import filament from Excel',
    sheet: 'Filament',
    columns:
      'Colour (or Color), and either Grams available or Closing (spools, 1 spool = 1000 g). Material is optional and defaults to PLA',
    rule: 'A material and colour already on the shelf has its stock replaced; a blank reorder level keeps the current one.',
  },
  items: {
    button: 'Import items',
    title: 'Import items from Excel',
    sheet: 'Boxes',
    columns:
      'Name (or Boxes), and Quantity (or Remaining; blank means none). Unit defaults to piece; Unit price and Code are optional',
    rule: 'An item already on the shelf (matched by name) has its quantity, unit and price replaced.',
  },
}

/**
 * Bulk-adds one shelf's records from an .xlsx.
 *
 * Validation is entirely the backend's, and all or nothing: it answers with
 * every problem at once, row by row, and this lists them verbatim - the person
 * holding the spreadsheet needs the row number, not a summary.
 */
export function InventoryImportDialog({ kind }: InventoryImportDialogProps): JSX.Element {
  const router = useRouter()
  const copy = COPY[kind]
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [problems, setProblems] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function reset(): void {
    setFile(null)
    setProblems([])
    setError(null)
    setResult(null)
    setBusy(false)
  }

  async function submit(): Promise<void> {
    if (!file) return
    setBusy(true)
    setProblems([])
    setError(null)
    try {
      const body = new FormData()
      body.append('file', file)
      const response = await fetch(`/api/inventory-import/${kind}`, { method: 'POST', body })
      const data: unknown = await response.json().catch(() => ({}))
      if (!response.ok) {
        const payload = data as { detail?: string; problems?: string[] }
        setProblems(payload.problems ?? [])
        setError(payload.detail ?? 'The spreadsheet was not accepted.')
        return
      }
      const payload = data as { created?: number; updated?: number; columns?: string[] }
      const kept = payload.columns ?? []
      setResult(
        `${payload.created ?? 0} added, ${payload.updated ?? 0} updated.` +
          (kept.length > 0 ? ` Kept as custom columns: ${kept.join(', ')}.` : ''),
      )
      router.refresh()
    } catch {
      setError('Could not reach Tensor-Core.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        <FileSpreadsheet className="size-4" aria-hidden /> {copy.button}
      </Button>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          <p className="text-muted-foreground text-sm text-pretty">
            Reads the sheet named {copy.sheet} if there is one, otherwise the first. Row 1 holds the
            headings: {copy.columns}. Any other column is kept as a custom column, and a TOTAL row
            is skipped. {copy.rule} Every row is checked first; if any row is wrong, nothing is
            imported.
          </p>
          <a href={`/api/inventory-import/${kind}`} className="self-start" download>
            <Button type="button" variant="ghost" size="sm">
              <Download className="size-4" aria-hidden /> Download template
            </Button>
          </a>
          <Field label="Spreadsheet" htmlFor={`import-${kind}`} hint=".xlsx, up to 10 MB">
            <Input
              id={`import-${kind}`}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={e => {
                setFile(e.target.files?.[0] ?? null)
                setProblems([])
                setError(null)
                setResult(null)
              }}
            />
          </Field>
          <ImportOutcome error={error} problems={problems} result={result} />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              {result ? 'Close' : 'Cancel'}
            </Button>
            <Button type="button" onClick={submit} disabled={busy || file === null}>
              <Upload className="size-4" aria-hidden />
              {busy ? 'Importing…' : 'Import'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
