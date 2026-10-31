import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type AccountsReport,
  type AccountsReportInput,
  AccountsReportSchema,
  type AccountsReportSendResult,
  AccountsReportSendResultSchema,
  type AccountsReportRun,
  AccountsReportRunsSchema,
} from '@/lib/validators/accounts-report'

const log = createLogger('AccountsReportService')

const READ_TIMEOUT_MS = 10_000

/**
 * Longer, because this one does real work: it reads a day of orders, builds a
 * spreadsheet and waits on an SMTP handshake. A timeout here would report
 * failure on a report that is about to arrive, and somebody would press Send
 * again.
 */
const SEND_TIMEOUT_MS = 90_000

export class AccountsReportServiceError extends Error {}

async function detailOf(response: Response): Promise<string | undefined> {
  return response
    .json()
    .then((body: { detail?: string }) => body.detail)
    .catch(() => undefined)
}

export async function getAccountsReport(token: string, brand: string): Promise<AccountsReport> {
  const path = `/brands/${encodeURIComponent(brand)}/accounts-report`
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(READ_TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ path, err: error }, 'Tensor-Core is unreachable')
    throw new AccountsReportServiceError('Tensor-Core is unreachable. Is the backend running?')
  }
  if (!response.ok) {
    throw new AccountsReportServiceError(
      (await detailOf(response)) ?? 'Could not load the report settings.',
    )
  }
  const parsed = AccountsReportSchema.safeParse(await response.json())
  if (!parsed.success) {
    log.error({ path, issues: parsed.error.issues }, 'Unexpected settings shape')
    throw new AccountsReportServiceError('Tensor-Core returned something unexpected.')
  }
  return parsed.data
}

export async function saveAccountsReport(
  token: string,
  brand: string,
  input: AccountsReportInput,
): Promise<AccountsReport> {
  const path = `/brands/${encodeURIComponent(brand)}/accounts-report`
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      cache: 'no-store',
      signal: AbortSignal.timeout(READ_TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ path, err: error }, 'Tensor-Core is unreachable')
    throw new AccountsReportServiceError('Tensor-Core is unreachable, so nothing was saved.')
  }
  if (!response.ok) {
    // The backend names the offending address and the field it was in -
    // "invalid input" on a list of twenty leaves somebody hunting.
    throw new AccountsReportServiceError(
      (await detailOf(response)) ?? 'Could not save the report settings.',
    )
  }
  const parsed = AccountsReportSchema.safeParse(await response.json())
  if (!parsed.success) {
    throw new AccountsReportServiceError('Tensor-Core returned something unexpected.')
  }
  return parsed.data
}

/**
 * Sends one register now.
 *
 * NOT RETRYABLE BLINDLY. This mails a real accountant; a second press is a
 * second register for the same day, and working out which one is current is
 * their problem rather than ours.
 */
export async function sendAccountsReportNow(
  token: string,
  brand: string,
): Promise<AccountsReportSendResult> {
  const path = `/brands/${encodeURIComponent(brand)}/accounts-report/send`
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ path, err: error }, 'Tensor-Core is unreachable')
    throw new AccountsReportServiceError(
      'Tensor-Core did not answer in time. The report may still have been sent — ' +
        'check the mailbox before sending again.',
    )
  }
  if (!response.ok) {
    // The mail server's own sentence. Gmail says "Username and Password not
    // accepted" for an ordinary password where an app password is needed,
    // and that sentence is the entire fix.
    throw new AccountsReportServiceError(
      (await detailOf(response)) ?? 'The report could not be sent.',
    )
  }
  const parsed = AccountsReportSendResultSchema.safeParse(await response.json())
  if (!parsed.success) {
    throw new AccountsReportServiceError('Tensor-Core returned something unexpected.')
  }
  return parsed.data
}

/** The register's history: every send, and every failure, newest first. */
export async function listAccountsReportRuns(
  token: string,
  brand: string,
): Promise<AccountsReportRun[]> {
  const path = `/brands/${encodeURIComponent(brand)}/accounts-report/runs`
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(READ_TIMEOUT_MS),
      cache: 'no-store',
    })
  } catch (err) {
    log.error({ err, path }, 'Tensor-Core is unreachable')
    throw new AccountsReportServiceError('Could not reach Tensor-Core.')
  }
  if (!response.ok) {
    const detail = await detailOf(response)
    log.warn({ path, status: response.status, detail }, 'Tensor-Core rejected the request')
    throw new AccountsReportServiceError(detail ?? "Could not read the register's history.")
  }
  return AccountsReportRunsSchema.parse(await response.json()).items
}

/**
 * Streams one run's spreadsheet. Returned as the raw upstream response so the
 * route can forward Content-Disposition, which is the only thing carrying the
 * real filename to the browser.
 */
export async function fetchAccountsReportFile(
  token: string,
  brand: string,
  runID: string,
): Promise<Response> {
  const path =
    `/brands/${encodeURIComponent(brand)}/accounts-report` +
    `/runs/${encodeURIComponent(runID)}/file`
  const response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(READ_TIMEOUT_MS),
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new AccountsReportServiceError(
      (await detailOf(response)) ?? 'Could not read that spreadsheet.',
    )
  }
  return response
}
