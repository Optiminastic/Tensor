import { z } from 'zod'

import { RoleSchema } from '@/lib/validators/authz'

/** Whether Tensor has an admin yet. A UI hint; the backend is the real gate. */
export const BootstrapStatusSchema = z.object({
  adminExists: z.boolean(),
})

/** A brand slug: lowercase alphanumerics separated by single hyphens. */
export const BrandSlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'invalid brand slug')

/**
 * What an admin submits to invite someone. Notably: no password field. The
 * assigned brands are granted to the member when they accept the invite.
 */
export const InviteCreateSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: RoleSchema,
  brand_slugs: z.array(BrandSlugSchema).default([]),
})

/**
 * A created invite. `token` is returned exactly once and is unrecoverable
 * afterwards — the backend stores only its hash.
 */
export const InviteCreatedSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: RoleSchema,
  brand_slugs: z.array(BrandSlugSchema),
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
  brand_slugs: z.array(BrandSlugSchema),
})

/** What an admin submits to replace a member's brand access. */
export const SetMemberBrandsSchema = z.object({
  brand_slugs: z.array(BrandSlugSchema).default([]),
})

export type InviteCreateInput = z.infer<typeof InviteCreateSchema>
export type InviteCreated = z.infer<typeof InviteCreatedSchema>
export type Invite = z.infer<typeof InviteSchema>
export type InviteValidated = z.infer<typeof InviteValidatedSchema>
export type Member = z.infer<typeof MemberSchema>
export type SetMemberBrandsInput = z.infer<typeof SetMemberBrandsSchema>
