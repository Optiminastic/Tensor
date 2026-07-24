import { z } from 'zod'

import { RoleSchema } from '@/lib/validators/authz'

/** Whether Tensor has an admin yet. A UI hint; the backend is the real gate. */
export const BootstrapStatusSchema = z.object({
  adminExists: z.boolean(),
})

/** What an admin submits to invite someone. Notably: no password field. */
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

export type InviteCreateInput = z.infer<typeof InviteCreateSchema>
export type InviteCreated = z.infer<typeof InviteCreatedSchema>
export type Invite = z.infer<typeof InviteSchema>
export type InviteValidated = z.infer<typeof InviteValidatedSchema>
