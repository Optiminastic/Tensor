import type { Metadata } from 'next'
import type { JSX } from 'react'

import { AccountsReportDialog } from '@/components/settings/accounts-report-dialog'
import { AccountsReportRuns } from '@/components/settings/accounts-report-runs'
import { AccountsReportSwitch } from '@/components/settings/accounts-report-switch'
import {
  NoBrandChosen,
  SettingsHeader,
  SettingsNotice,
} from '@/components/settings/settings-header'
import { requirePermission } from '@/lib/authz'
import type { AccountsReport, AccountsReportRun } from '@/lib/validators/accounts-report'
import {
  AccountsReportServiceError,
  getAccountsReport,
  listAccountsReportRuns,
} from '@/services/accounts-report.service'

import { loadSettingsContext } from '../settings-context'

export const metadata: Metadata = { title: 'Accounts report' }

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ brand?: string }>
}

/**
 * The daily sales register: who it goes to, and what it asserts about tax.
 *
 * TWO GATES, DELIBERATELY. loadSettingsContext already requires brand:manage,
 * which ADMIN alone holds, so the whole Settings area is admin-only. This page
 * additionally requires accounts:manage - because the two are separable: a
 * future role could be given the workspace without being given an outbound
 * channel for every sale the shop has made.
 */
export default async function AccountsReportPage({
  searchParams,
}: PageProps): Promise<JSX.Element> {
  const { brand } = await searchParams
  const context = await loadSettingsContext(brand, '/dashboard/settings/accounts-report')
  await requirePermission('accounts:manage', '/dashboard/settings')

  let report: AccountsReport | null = null
  let runs: AccountsReportRun[] = []
  let error: string | null = context.loadError

  if (context.token && context.profile) {
    try {
      report = await getAccountsReport(context.token, context.profile.slug)
    } catch (err) {
      error =
        err instanceof AccountsReportServiceError
          ? err.message
          : 'Could not load the report settings.'
    }
    try {
      runs = await listAccountsReportRuns(context.token, context.profile.slug)
    } catch {
      // DELIBERATELY SILENT, and deliberately not fatal. The history is what
      // this page shows, but the settings are what it exists to let somebody
      // fix - and a page that refuses to render because a list could not be
      // read would take the fix away along with the answer. An empty table
      // says its own "nothing sent yet".
      runs = []
    }
  }

  return (
    // The same wrapper as Workspace, Brand and Integrations. Settings reads as
    // one area, and a page that runs to the window edge while its siblings sit
    // in a measured column reads as a different product.
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6">
      {/* The button sits beside the title rather than above the table: it
          opens the settings, which are about the whole page, not about the
          list underneath it. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SettingsHeader
          title="Accounts report"
          description="A daily sales register, mailed as the spreadsheet your accountant files from. One row per line item, covering noon to noon."
        />
        {context.profile && report ? (
          <div className="flex flex-wrap items-center gap-4">
            {/* The state that decides whether anything is ever sent, readable
                without opening anything. */}
            <AccountsReportSwitch brand={context.profile.slug} report={report} />
            <AccountsReportDialog brand={context.profile.slug} initial={report} />
          </div>
        ) : null}
      </div>

      {error ? <SettingsNotice tone="danger">{error}</SettingsNotice> : null}

      {!context.profile ? (
        <NoBrandChosen
          what="Report recipients"
          why="each brand has its own accountant and its own sales"
        />
      ) : report ? (
        <AccountsReportRuns brand={context.profile.slug} runs={runs} />
      ) : null}
    </main>
  )
}
