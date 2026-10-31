'use client'

import { Mail } from 'lucide-react'
import { type JSX, useState } from 'react'

import { AccountsReportForm } from '@/components/settings/accounts-report-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { AccountsReport } from '@/lib/validators/accounts-report'

interface AccountsReportDialogProps {
  brand: string
  initial: AccountsReport
}

/**
 * The recipient list and tax settings, behind a button.
 *
 * The page is now about what has been SENT, because that is what somebody
 * opens it to find - yesterday's spreadsheet, or why Thursday's never
 * arrived. The settings are a thing you change once and then leave alone, so
 * they sit a click away rather than occupying the page above the answer.
 *
 * NOT A SEPARATE FORM. The dialog wraps the same component the page used to
 * render inline, so there is one place where a recipient list is edited and
 * one place where Send now lives - the save and the send already ask the
 * server to revalidate, so the history behind the dialog refreshes itself.
 */
export function AccountsReportDialog({ brand, initial }: AccountsReportDialogProps): JSX.Element {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Mail className="size-3.5" aria-hidden />
          Add email
        </Button>
      </DialogTrigger>
      {/* Tall and scrollable: the form carries two explanatory paragraphs
          about GST that are the difference between a correct register and a
          confidently wrong one, and they are not worth truncating. */}
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report recipients</DialogTitle>
          <DialogDescription>
            Who the daily register goes to, and what it asserts about tax.
          </DialogDescription>
        </DialogHeader>
        <AccountsReportForm brand={brand} initial={initial} />
      </DialogContent>
    </Dialog>
  )
}
