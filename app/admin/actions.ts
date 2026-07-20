'use server'

import { headers } from 'next/headers'

import { auth } from '@/lib/auth'
import { buildInviteEmail } from '@/lib/emails/invite-email'
import { createLogger } from '@/lib/logger'
import { type SendResult, sendMail } from '@/lib/mailer'
import { type Invite, type InviteCreated, InviteCreateSchema } from '@/lib/validators/admin'
import { SetPasswordSchema } from '@/lib/validators/auth'
import {
  AdminServiceError,
  acceptInvite,
  adminExists,
  bootstrapAdmin,
  checkInvite,
  createInvite,
} from '@/services/admin.service'

const log = createLogger('AdminActions')

export interface ActionResult<T = undefined> {
  ok: boolean
  error?: string
  data?: T
}

/**
 * Account creation lives here, in server actions — never in the browser.
 *
 * `/api/auth/sign-up/email` is blocked at the route, so `auth.api.signUpEmail`
 * from a server action is the only way an account is ever made. That is the
 * whole point: the door is open on this side and shut on the public one.
 */

/** Create the very first admin. Refused by the backend once one exists. */
export async function createFirstAdmin(input: unknown): Promise<ActionResult> {
  const parsed = SetPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' }
  }
  const { name, email, password } = parsed.data

  // A UI-level check, so the common case gives a clear message. It is not the
  // gate — two people could pass this at the same moment. The backend's
  // one-shot refusal below is what actually enforces it.
  try {
    if (await adminExists()) {
      return { ok: false, error: 'An admin already exists. Ask them to invite you.' }
    }
  } catch (error) {
    return { ok: false, error: describe(error) }
  }

  let userId: string
  try {
    const created = await auth.api.signUpEmail({ body: { name, email, password } })
    userId = created.user.id
  } catch (error) {
    log.error({ err: error }, 'Failed to create the first admin')
    return { ok: false, error: 'Could not create that account. Is the email already in use?' }
  }

  try {
    await bootstrapAdmin(userId)
  } catch (error) {
    // The account exists but holds no role. It fails closed — they can sign in
    // and do nothing — so this is safe to report rather than unwind. Unwinding
    // would mean deleting a user we just made, which is worse.
    log.error({ userId, err: error }, 'Created the admin account but could not grant ADMIN')
    return {
      ok: false,
      error: `${describe(error)} The account was created but has no role yet.`,
    }
  }

  log.info({ userId, email }, 'First admin created')
  return { ok: true }
}

/** Redeem an invite: create the account, then attach the invited role. */
export async function acceptInviteAndSetPassword(
  token: string,
  input: unknown,
): Promise<ActionResult> {
  const parsed = SetPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' }
  }
  const { name, password } = parsed.data

  // The invite decides the address — never the caller.
  //
  // A server action's arguments are client-controlled: the read-only field on
  // the form is a UI affordance, not a constraint, and the POST behind it can
  // be replayed with any payload. Trusting `input.email` would let anyone
  // holding a link register under *any* address and collect the invited role,
  // so the admin's list would show they invited one person while a different
  // account holds the access. Re-resolving the invite server-side is what makes
  // "the admin chooses who gets in" true rather than aspirational.
  let invitedEmail: string
  try {
    invitedEmail = (await checkInvite(token)).email
  } catch (error) {
    return { ok: false, error: describe(error) }
  }

  let userId: string
  try {
    const created = await auth.api.signUpEmail({
      body: { name, email: invitedEmail, password },
    })
    userId = created.user.id
  } catch (error) {
    log.error({ err: error }, 'Failed to create an invited account')
    return { ok: false, error: 'Could not create that account. Is the email already in use?' }
  }

  try {
    // Burns the invite and grants the role in one backend transaction.
    await acceptInvite(token, userId)
  } catch (error) {
    log.error({ userId, err: error }, 'Account created but the invite could not be redeemed')
    return { ok: false, error: `${describe(error)} The account was created but has no role yet.` }
  }

  log.info({ userId }, 'Invite accepted')
  return { ok: true }
}

/**
 * Invite someone to hold a role.
 *
 * Deliberately does not check permissions here. It forwards the caller's access
 * token and lets Tensor-Core enforce `user:manage` — the frontend does not get
 * a vote on authorization.
 */
export interface InviteResult {
  inviteUrl: string
  invite: Invite
  emailed: boolean
  emailError?: string
}

export async function inviteUser(input: unknown): Promise<ActionResult<InviteResult>> {
  const parsed = InviteCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' }
  }

  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session) return { ok: false, error: 'Your session has expired. Sign in again.' }

  const token = await auth.api.getToken({ headers: requestHeaders })
  if (!token?.token) return { ok: false, error: 'Could not mint an access token. Sign in again.' }

  try {
    const created = await createInvite(token.token, parsed.data)
    const inviteUrl = buildInviteUrl(created.token)
    const mail = await deliverInvite(created, inviteUrl, session.user)

    return {
      ok: true,
      data: {
        inviteUrl,
        emailed: mail.sent,
        emailError: mail.sent ? undefined : mail.reason,
        // Returned so the list can show the new row immediately. Without it the
        // page briefly reads "No invitations yet" directly under the invitation
        // that was just created, which is a confusing thing to show an admin.
        // The token is deliberately dropped here — the list must never carry it.
        invite: {
          id: created.id,
          email: created.email,
          role: created.role,
          expires_at: created.expires_at,
          accepted_at: null,
          revoked_at: null,
          created_by: session.user.id,
        },
      },
    }
  } catch (error) {
    return { ok: false, error: describe(error) }
  }
}

function buildInviteUrl(token: string): string {
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? ''
  return `${origin}/accept-invite?token=${encodeURIComponent(token)}`
}

/**
 * Email the invitation. Best-effort by design.
 *
 * The invitation is already valid and stored by the time this runs — email is
 * only delivery. A mail failure must not lose it or fail the request, so the
 * caller returns the link either way and the admin can hand it over directly.
 */
async function deliverInvite(
  created: InviteCreated,
  inviteUrl: string,
  invitedBy: { name: string; email: string },
): Promise<SendResult> {
  return sendMail(
    buildInviteEmail({
      to: created.email,
      role: created.role,
      inviteUrl,
      invitedByName: invitedBy.name,
      invitedByEmail: invitedBy.email,
    }),
  )
}

function describe(error: unknown): string {
  if (error instanceof AdminServiceError) return error.message
  return 'Something went wrong. Please try again.'
}
