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
