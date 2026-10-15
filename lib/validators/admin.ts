import { z } from 'zod'

import { RoleSchema } from '@/lib/validators/authz'

/** Whether Tensor has an admin yet. A UI hint; the backend is the real gate. */
export const BootstrapStatusSchema = z.object({
  adminExists: z.boolean(),
})

/**
 * What an admin submits to invite someone. Notably: no password field, and no
 * brands — every role reaches every store, so there is nothing per-member to
 * assign (Tensor-Core migration 0087).
 */
export const InviteCreateSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: RoleSchema,
})

/**
 * A created invite. `token` is returned exactly once and is unrecoverable
 * afterwards — the backend stores only its hash.
 */
export const InviteCreatedSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: RoleSchema,
  // NO brand_slugs. It was required here and has not been sent since "every
  // role can access every store" removed per-member brands from the backend,
  // so every single invite failed this parse - and a ZodError is not an
  // AdminServiceError, so the admin was told "Something went wrong. Please
  // try again." The invite was created regardless, because the transaction
  // commits before the response is parsed: the retries that message invites
  // are what put duplicate rows in the invitations list.
  expires_at: z.string(),
  token: z.string(),
})

/** An invite as listed. Never carries a token. */
export const InviteSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: RoleSchema,
  expires_at: z.string(),
  accepted_at: z.string().nullable(),
  revoked_at: z.string().nullable(),
  created_by: z.string().nullable(),
})

/** All an invitee's browser may learn from a token: who it is for. */
export const InviteValidatedSchema = z.object({
  email: z.string(),
  role: RoleSchema,
})

/**
 * A team member as returned by GET /admin/users: their id, roles and assigned
 * brands. Emails are joined on the frontend (Better Auth owns the user table).
 */
export const MemberSchema = z.object({
  user_id: z.string(),
  roles: z.array(RoleSchema),
})

export type InviteCreateInput = z.infer<typeof InviteCreateSchema>
export type InviteCreated = z.infer<typeof InviteCreatedSchema>
export type Invite = z.infer<typeof InviteSchema>
export type InviteValidated = z.infer<typeof InviteValidatedSchema>
export type Member = z.infer<typeof MemberSchema>
