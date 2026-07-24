import nodemailer, { type Transporter } from 'nodemailer'

import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'

const log = createLogger('Mailer')

/**
 * SMTP transport.
 *
 * Deliberately optional. With no SMTP configured, `sendMail` reports that it
 * did not send and the caller falls back to handing the invite link over by
 * hand. Onboarding must never be blocked by a mail outage — the link is the
 * real mechanism, email is only a delivery convenience.
 *
 * Nothing here ever logs the password, the recipient's token, or the invite
 * URL: an invite link is a credential, and logs are the wrong place for it.
 */

export interface SendResult {
  sent: boolean
  /** Safe to show an admin. Never contains the link or the password. */
  reason?: string
}

interface SmtpConfig {
  host: string
  user: string
  password: string
  fromEmail: string
}

/**
 * The SMTP settings, or null when the group is incomplete.
 *
 * Returning a narrowed object rather than a boolean is what lets the rest of
 * this file use the values without non-null assertions: if this returns
 * something, every field is a string.
 */
function resolveConfig(): SmtpConfig | null {
  const { SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL } = env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM_EMAIL) return null
  return {
    host: SMTP_HOST,
    user: SMTP_USER,
    password: SMTP_PASSWORD,
    fromEmail: SMTP_FROM_EMAIL,
  }
}

const globalForMail = globalThis as unknown as { mailer: Transporter | undefined }

function getTransport(config: SmtpConfig): Transporter {
  if (globalForMail.mailer) return globalForMail.mailer

  const transport = nodemailer.createTransport({
    host: config.host,
    port: env.SMTP_PORT,
    // 587 is STARTTLS: connect in the clear, then upgrade. `secure: true` is
    // for implicit TLS on 465 and fails on 587, which is a confusing hang.
    secure: env.SMTP_PORT === 465,
    auth: { user: config.user, pass: config.password },
    // Bound so a stalled SMTP server cannot hold a server action open.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  })

  if (env.NODE_ENV !== 'production') globalForMail.mailer = transport
  return transport
}

export interface Mail {
  to: string
  subject: string
  text: string
  html: string
}

/**
 * Send one message. Never throws.
 *
 * Callers treat mail as best-effort: an invitation is already valid before this
 * runs, so a failure here must not lose it or fail the request.
 */
export async function sendMail(mail: Mail): Promise<SendResult> {
  const config = resolveConfig()
  if (!config) {
    log.warn({ to: mail.to }, 'SMTP is not configured; skipping send')
    return { sent: false, reason: 'Email is not configured on this environment.' }
  }

  try {
    await getTransport(config).sendMail({
      from: { name: env.TENSOR_FROM_NAME, address: config.fromEmail },
      replyTo: env.SMTP_REPLY_TO ?? config.fromEmail,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    })
    log.info({ to: mail.to, subject: mail.subject }, 'Mail sent')
    return { sent: true }
  } catch (error) {
    // The message may name the host or the auth failure, but never the body.
    log.error({ to: mail.to, err: error }, 'Mail send failed')
    return { sent: false, reason: 'Could not send the email. Share the link yourself.' }
  }
}

/** Prove the credentials work, without sending anything. For a health check. */
export async function verifyMailer(): Promise<SendResult> {
  const config = resolveConfig()
  if (!config) return { sent: false, reason: 'SMTP is not configured.' }
  try {
    await getTransport(config).verify()
    return { sent: true }
  } catch (error) {
    log.error({ err: error }, 'SMTP verification failed')
    return { sent: false, reason: error instanceof Error ? error.message : 'SMTP check failed.' }
  }
}
