import { z } from 'zod'

/**
 * The five Tensor roles. The backend owns the role table; this enum is the
 * frontend's contract with it, and the schema below fails loudly if the
 * backend ever returns something outside it.
 */
export const RoleSchema = z.enum([
  'ADMIN',
  'DESIGNER',
  'PROJECT_LEAD',
  'PERFORMANCE_MARKETER',
  'OPERATOR',
])

export type Role = z.infer<typeof RoleSchema>

/** A permission is `resource:action`, e.g. `pricing:override`. */
const PermissionSchema = z.string().regex(/^[a-z_]+:[a-z_]+$/, 'expected resource:action')

/**
 * What Tensor-Core returns for a user's authorization state.
 *
 * `permissionsVersion` is stamped into the access token. It is bumped whenever
 * the user's roles change, so a token minted before the change is detectable
 * as stale without embedding the whole permission set in the claim.
 */
export const UserAuthzSchema = z.object({
  roles: z.array(RoleSchema),
  permissions: z.array(PermissionSchema),
  permissionsVersion: z.number().int().nonnegative(),
})

export type UserAuthz = z.infer<typeof UserAuthzSchema>
