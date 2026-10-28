'use server'

import { headers } from 'next/headers'

import { getTokenSafe } from '@/lib/auth'
import { requirePermission } from '@/lib/authz'
import { createLogger } from '@/lib/logger'
import type { AccountsReport, AccountsReportSendResult } from '@/lib/validators/accounts-report'
import {
  AccountsReportServiceError,
  getAccountsReport,
  saveAccountsReport,
  sendAccountsReportNow,
} from '@/services/accounts-report.service'

const log = createLogger('AccountsReportActions')

export interface ActionResult<T = undefined> {
  ok: boolean
  error?: string
  data?: T
}

/**
 * THE BRAND IS AN ARGUMENT, AND THAT IS FINE. A server action's arguments are
 * client-controlled, so this could be called with any slug - but the backend
 * checks accounts:manage against the token and scopes every query to that
 * brand, and that is the check which counts. Hiding the page is convenience.
 *
 * The permission is re-asserted here anyway so an unauthorised call fails at
 * the edge rather than travelling to Tensor-Core to be refused there.
 */
async function token(): Promise<string | null> {
  await requirePermission('accounts:manage', '/dashboard')
  return (await getTokenSafe(await headers()))?.token ?? null
}

export async function saveAccountsReportAction(input: {
  brand: string
  enabled: boolean
  to: string[]
  cc: string[]
  bcc: string[]
  gst_percent: number
  seller_state: string
}): Promise<ActionResult<AccountsReport>> {
  const auth = await token()
  if (!auth) return { ok: false, error: 'Your session has expired. Sign in again.' }
  const { brand, ...rest } = input
  try {
    return { ok: true, data: await saveAccountsReport(auth, brand, rest) }
  } catch (err) {
    if (err instanceof AccountsReportServiceError) return { ok: false, error: err.message }
    log.error({ err }, 'Unexpected save error')
    return { ok: false, error: 'Something went wrong. Please try again.' }
  }
}

/**
 * Sends one register immediately.
 *
 * This mails a real accountant and CLOSES THE DAY'S WINDOW, so the scheduled
 * run will not send it again. The screen asks before calling this.
 */
export async function sendAccountsReportAction(
  brand: string,
): Promise<ActionResult<AccountsReportSendResult>> {
  const auth = await token()
  if (!auth) return { ok: false, error: 'Your session has expired. Sign in again.' }
  try {
    return { ok: true, data: await sendAccountsReportNow(auth, brand) }
  } catch (err) {
    if (err instanceof AccountsReportServiceError) return { ok: false, error: err.message }
    log.error({ err }, 'Unexpected send error')
    return { ok: false, error: 'Something went wrong. Please try again.' }
  }
}

export async function reloadAccountsReportAction(
  brand: string,
): Promise<ActionResult<AccountsReport>> {
  const auth = await token()
  if (!auth) return { ok: false, error: 'Your session has expired. Sign in again.' }
  try {
    return { ok: true, data: await getAccountsReport(auth, brand) }
  } catch (err) {
    if (err instanceof AccountsReportServiceError) return { ok: false, error: err.message }
    return { ok: false, error: 'Something went wrong. Please try again.' }
  }
}
