import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  BootstrapStatusSchema,
  type Invite,
  type InviteCreateInput,
  type InviteCreated,
  InviteCreatedSchema,
  InviteSchema,
  type InviteValidated,
  InviteValidatedSchema,
  type Member,
  MemberSchema,
} from '@/lib/validators/admin'

const log = createLogger('AdminService')

const TIMEOUT_MS = 5_000

/**
 * Typed client for Tensor-Core's admin and bootstrap endpoints.
 *
 * Server-only. Every function here either carries the shared internal secret or
 * an admin's bearer token, and neither may ever reach the browser — import this
 * from server actions and server components only.
 */

export class AdminServiceError extends Error {}

async function request<T>(
  path: string,
  init: RequestInit,
  parse: (data: unknown) => T,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}${path}`, {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ path, err: error }, 'Tensor-Core is unreachable')
    throw new AdminServiceError('Tensor-Core is unreachable. Is the backend running?')
  }

  if (!response.ok) {
    // The backend's `detail` is written for humans (e.g. "This invitation is no
    // longer valid"), so it is safe and useful to surface.
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ path, status: response.status, detail }, 'Tensor-Core rejected the request')
    throw new AdminServiceError(detail ?? `Request failed (${response.status})`)
  }

  if (response.status === 204) return parse(undefined)
  return parse(await response.json())
}

function internalHeaders(): HeadersInit {
  return {
    'X-Internal-Secret': env.INTERNAL_API_SECRET,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

/** Does Tensor have an admin yet? Decides what /admin renders. */
export async function adminExists(): Promise<boolean> {
  const status = await request('/internal/bootstrap-status', { headers: internalHeaders() }, data =>
    BootstrapStatusSchema.parse(data),
  )
  return status.adminExists
}

/**
 * Promote the first user to ADMIN. The backend refuses once any admin exists,
 * so this cannot be replayed to self-promote.
 */
export async function bootstrapAdmin(userId: string): Promise<void> {
  await request(
    '/internal/bootstrap-admin',
    { method: 'POST', headers: internalHeaders(), body: JSON.stringify({ user_id: userId }) },
    () => undefined,
  )
}

/** Who an invite token is for. Called before any user or session exists. */
export async function checkInvite(token: string): Promise<InviteValidated> {
  return request(
    `/internal/invites/${encodeURIComponent(token)}`,
    { headers: internalHeaders() },
    data => InviteValidatedSchema.parse(data),
  )
}

/** Redeem an invite for a newly created user, attaching their role. */
export async function acceptInvite(token: string, userId: string): Promise<void> {
  await request(
    '/internal/invites/accept',
    {
      method: 'POST',
      headers: internalHeaders(),
      body: JSON.stringify({ token, user_id: userId }),
    },
    () => undefined,
  )
}

function bearer(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

/**
 * Invite someone to hold a role.
 *
 * Takes the *admin's* access token rather than the internal secret: the backend
 * enforces `user:manage` against it, so authorization is decided there and not
 * by whichever page happened to call this.
 */
export async function createInvite(
  accessToken: string,
  input: InviteCreateInput,
): Promise<InviteCreated> {
  return request(
    '/admin/invites',
    { method: 'POST', headers: bearer(accessToken), body: JSON.stringify(input) },
    data => InviteCreatedSchema.parse(data),
  )
}

export async function listInvites(accessToken: string): Promise<Invite[]> {
  return request('/admin/invites', { headers: bearer(accessToken) }, data =>
    InviteSchema.array().parse(data),
  )
}

export async function revokeInvite(accessToken: string, inviteId: string): Promise<void> {
  await request(
    `/admin/invites/${encodeURIComponent(inviteId)}/revoke`,
    { method: 'POST', headers: bearer(accessToken) },
    () => undefined,
  )
}

/** Every team member with a role, plus the brands each is assigned. */
export async function listMembers(accessToken: string): Promise<Member[]> {
  return request('/admin/users', { headers: bearer(accessToken) }, data =>
    MemberSchema.array().parse(data),
  )
}

/** Remove a member: delete their roles + brand access (their account remains). */
export async function removeMember(accessToken: string, userId: string): Promise<void> {
  await request(
    `/admin/users/${encodeURIComponent(userId)}`,
    { method: 'DELETE', headers: bearer(accessToken) },
    () => undefined,
  )
}

/** Replace a member's brand access with the given set of slugs. */
export async function setMemberBrands(
  accessToken: string,
  userId: string,
  brandSlugs: string[],
): Promise<void> {
  await request(
    `/admin/users/${encodeURIComponent(userId)}/brands`,
    {
      method: 'PUT',
      headers: bearer(accessToken),
      body: JSON.stringify({ brand_slugs: brandSlugs }),
    },
    () => undefined,
  )
}
