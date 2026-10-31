import { z } from 'zod'

/**
 * The daily sales register's settings.
 *
 * ADMIN ONLY, and the backend is what enforces that. The recipient list is an
 * outbound channel for the shop's complete sales figures, so hiding the page
 * is convenience - `accounts:manage` on every route is the actual control.
 */
export const AccountsReportSchema = z.object({
  enabled: z.boolean(),
  to: z.array(z.string()),
  cc: z.array(z.string()),
  bcc: z.array(z.string()),

  /**
   * The rate the register asserts. Shopify reports no tax on this store, so
   * the GST columns are derived from this rather than read.
   */
  gst_percent: z.number(),
  /** Decides CGST+SGST against IGST. */
  seller_state: z.string(),

  /** False when nobody has ever saved this screen. */
  configured: z.boolean(),
  /**
   * False when the service has no SMTP credentials. The page says so before
   * somebody fills in a recipient list that can never be used.
   */
  mailbox_ready: z.boolean(),
  mailbox_from: z.string(),

  last_window_end: z.string(),
  last_sent_at: z.string(),
  last_row_count: z.number(),
  /** The server's own words for why the last attempt failed. */
  last_error: z.string(),

  /** The window the next run will cover, so "daily" is never guessed at. */
  next_window_start: z.string(),
  next_window_end: z.string(),
})

export const AccountsReportSendResultSchema = z.object({
  sent: z.boolean(),
  orders: z.number(),
  rows: z.number(),
  recipients: z.number(),
  filename: z.string(),
  window_start: z.string(),
  window_end: z.string(),
})

export type AccountsReport = z.infer<typeof AccountsReportSchema>
export type AccountsReportSendResult = z.infer<typeof AccountsReportSendResultSchema>

export interface AccountsReportInput {
  enabled: boolean
  to: string[]
  cc: string[]
  bcc: string[]
  gst_percent: number
  seller_state: string
}

/**
 * One register that went out, or failed trying.
 *
 * The settings above carry only the LAST of each - one row per brand,
 * overwritten daily - which cannot answer "send me Tuesday's file" or "why did
 * Thursday not arrive". This is the history that can.
 */
export const AccountsReportRunSchema = z.object({
  id: z.string(),
  /** The noon-to-noon window covered, not when it was mailed. */
  window_start: z.string(),
  window_end: z.string(),
  sent_at: z.string(),
  /** 'sent' or 'failed'. A failure is a row too, which is the point. */
  status: z.string(),
  /** The reason, when it failed. Empty otherwise. */
  detail: z.string(),
  rows: z.number(),
  orders: z.number(),
  /**
   * Who it actually went to. Stored as sent, so editing the recipient list
   * does not rewrite what last week's mail says it went to.
   */
  to: z.array(z.string()),
  cc: z.array(z.string()),
  bcc: z.array(z.string()),
  /** 'scheduled' or 'manual', so a test send is not read as the day's. */
  source: z.string(),
  /**
   * False for a failure, and for any register sent before this history
   * existed. The row is still worth showing; only the download is not.
   */
  has_file: z.boolean(),
  filename: z.string(),
  size_bytes: z.number(),
})

export const AccountsReportRunsSchema = z.object({ items: z.array(AccountsReportRunSchema) })

export type AccountsReportRun = z.infer<typeof AccountsReportRunSchema>
