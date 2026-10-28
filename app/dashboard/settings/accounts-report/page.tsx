import type { Metadata } from 'next'
import type { JSX } from 'react'

import { AccountsReportForm } from '@/components/settings/accounts-report-form'
import {
  NoBrandChosen,
  SettingsHeader,
  SettingsNotice,
} from '@/components/settings/settings-header'
import { requirePermission } from '@/lib/authz'
import type { AccountsReport } from '@/lib/validators/accounts-report'
import { AccountsReportServiceError, getAccountsReport } from '@/services/accounts-report.service'

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
  }

  return (
    // The same wrapper as Workspace, Brand and Integrations. Settings reads as
    // one area, and a page that runs to the window edge while its siblings sit
    // in a measured column reads as a different product.
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6">
      <SettingsHeader
        title="Accounts report"
        description="A daily sales register, mailed as the spreadsheet your accountant files from. One row per line item, covering noon to noon."
      />

      {error ? <SettingsNotice tone="danger">{error}</SettingsNotice> : null}

      {!context.profile ? (
        <NoBrandChosen
          what="Report recipients"
          why="each brand has its own accountant and its own sales"
        />
      ) : report ? (
        <AccountsReportForm brand={context.profile.slug} initial={report} />
      ) : null}
    </main>
  )
}
