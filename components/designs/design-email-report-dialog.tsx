'use client'

import { Mail } from 'lucide-react'
import { useState, type JSX } from 'react'

import { emailDesignReportForDesign } from '@/app/dashboard/[brand]/designs/report-actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

/** Emails the design's cost-report PDF to a recipient. Requires SMTP configured on
 * the backend; otherwise the send returns a "not configured" error. */
export function DesignEmailReportDialog({ designId }: { designId: string }): JSX.Element {
  const [open, setOpen] = useState(false)
  const [to, setTo] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)

  async function send(): Promise<void> {
    setError(null)
    setPending(true)
    const res = await emailDesignReportForDesign(designId, to.trim())
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not send the report.')
      return
    }
    setSentTo(res.data?.to ?? to.trim())
  }

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        setOpen(next)
        if (next) {
          setError(null)
          setSentTo(null)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Mail aria-hidden />
          Email report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Email cost report</DialogTitle>
        </DialogHeader>
        {sentTo ? (
          <p className="text-success text-sm">Report sent to {sentTo}.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <Field label="Recipient email" htmlFor="report-to">
              <Input
                id="report-to"
                type="email"
                value={to}
                onChange={e => setTo(e.target.value)}
                placeholder="lead@example.com"
                onKeyDown={e => {
                  if (e.key === 'Enter') void send()
                }}
              />
            </Field>
            {error ? (
              <p role="alert" className="text-danger text-sm">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end">
              <Button size="sm" disabled={pending || to.trim() === ''} onClick={() => void send()}>
                {pending ? 'Sending…' : 'Send'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
