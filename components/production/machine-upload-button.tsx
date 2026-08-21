'use client'

import { Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent, type JSX } from 'react'

import { uploadToPrinterAction } from '@/app/dashboard/[brand]/production/machine-upload-actions'
import { Button } from '@/components/ui/button'

interface MachineUploadButtonProps {
  machineId: string
}

/** What BambuBuddy can do something with. Mirrors the backend's own list, so a
 * rejected file is caught by the picker rather than after the upload.
 *
 * Raw .gcode is absent on purpose: BambuBuddy refuses it outright and asks for
 * a .gcode.3mf container instead, so offering it would only send a large file
 * across the network to be rejected at the far end. */
const ACCEPT = '.3mf,.gcode.3mf,.stl,.obj,.step'

/**
 * Sends a model file to this printer's BambuBuddy library and queues it.
 *
 * The label says "Queue file", not "Print": this puts work on BambuBuddy's
 * queue and stops there. Releasing it to the bed stays a deliberate act in
 * BambuBuddy, and a button that said "Print" would promise something it does
 * not do.
 */
export function MachineUploadButton({ machineId }: MachineUploadButtonProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  async function onPick(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0]
    // Reset immediately so picking the same file twice still fires a change.
    event.target.value = ''
    if (!file) return

    setBusy(true)
    setMessage(null)
    setFailed(false)

    const form = new FormData()
    form.set('file', file, file.name)
    const result = await uploadToPrinterAction(machineId, form)

    setBusy(false)
    if (!result.ok) {
      setFailed(true)
      setMessage(result.error ?? 'Could not upload the file.')
      return
    }
    // A file that reached the library but was not queued is reported honestly
    // rather than as a plain success. The commonest reason is real and specific
    // - BambuBuddy only queues SLICED files (.gcode/.gcode.3mf), so a design 3MF
    // lands in the library and stops there - and its own wording is clearer than
    // anything invented here.
    if (result.data && !result.data.queued) {
      setFailed(true)
      const reason = result.data.queue_note || 'it could not be added to the queue'
      setMessage(`${result.data.filename} is in the library, but ${reason}`)
      return
    }
    // BambuBuddy's dispatcher decides when it runs, so the message says what
    // will happen rather than claiming it started: a free printer picks it up
    // immediately, a busy one holds it and says why.
    const name = result.data?.filename ?? file.name
    const waiting = result.data?.queue_note
    const duplicate = result.data?.duplicate ? ' (already in the library)' : ''
    setMessage(
      waiting
        ? `${name} queued${duplicate} — ${waiting}`
        : `${name} sent to the printer${duplicate}. It starts as soon as the machine is free.`,
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={event => void onPick(event)}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-3.5" aria-hidden />
        {busy ? 'Uploading…' : 'Queue file'}
      </Button>
      {message ? (
        <p
          role="status"
          className={failed ? 'text-danger text-xs' : 'text-muted-foreground text-xs'}
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}
