'use server'

import { headers } from 'next/headers'

import { auth } from '@/lib/auth'
import { createLogger } from '@/lib/logger'
import { type Project, ProjectCreateSchema, ProjectUpdateSchema } from '@/lib/validators/projects'
import {
  ProjectServiceError,
  createProject as createProjectRequest,
  updateProject as updateProjectRequest,
} from '@/services/projects.service'

const log = createLogger('ProjectActions')

export interface ActionResult<T = undefined> {
  ok: boolean
  error?: string
  data?: T
}

function describe(error: unknown): string {
  if (error instanceof ProjectServiceError) return error.message
  log.error({ err: error }, 'Unexpected error in a project action')
  return 'Something went wrong. Please try again.'
}

/**
 * Mint the caller's access token, or return why we could not.
 *
 * Identity is re-resolved server-side on every call — a server action's
 * arguments are client-controlled, so `created_by` and the caller's right to
 * act are decided here and enforced in Tensor-Core, never taken from the form.
 */
async function requireToken(): Promise<{ token: string } | { error: string }> {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session) return { error: 'Your session has expired. Sign in again.' }

  const token = await auth.api.getToken({ headers: requestHeaders })
  if (!token?.token) return { error: 'Could not mint an access token. Sign in again.' }
  return { token: token.token }
}

export async function createProject(input: unknown): Promise<ActionResult<Project>> {
  const parsed = ProjectCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' }
  }

  const auth_ = await requireToken()
  if ('error' in auth_) return { ok: false, error: auth_.error }

  try {
    const project = await createProjectRequest(auth_.token, parsed.data)
    return { ok: true, data: project }
  } catch (error) {
    return { ok: false, error: describe(error) }
  }
}

export async function updateProject(
  projectId: string,
  input: unknown,
): Promise<ActionResult<Project>> {
  const parsed = ProjectUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' }
  }

  const auth_ = await requireToken()
  if ('error' in auth_) return { ok: false, error: auth_.error }

  try {
    const project = await updateProjectRequest(auth_.token, projectId, parsed.data)
    return { ok: true, data: project }
  } catch (error) {
    return { ok: false, error: describe(error) }
  }
}
