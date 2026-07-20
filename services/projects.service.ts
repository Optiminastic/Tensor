import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  type Project,
  type ProjectCreateInput,
  ProjectSchema,
  type ProjectUpdateInput,
} from '@/lib/validators/projects'

const log = createLogger('ProjectService')

const TIMEOUT_MS = 5_000

/**
 * Typed client for Tensor-Core's /projects endpoints.
 *
 * Server-only. Every call carries the admin's bearer token; the backend
 * enforces `project:read` / `project:manage` against it, so authorization is
 * decided there, not by whichever page called this.
 */

export class ProjectServiceError extends Error {}

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
    throw new ProjectServiceError('Tensor-Core is unreachable. Is the backend running?')
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ path, status: response.status, detail }, 'Tensor-Core rejected the request')
    throw new ProjectServiceError(detail ?? `Request failed (${response.status})`)
  }

  if (response.status === 204) return parse(undefined)
  return parse(await response.json())
}

function bearer(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

export async function listProjects(accessToken: string): Promise<Project[]> {
  return request('/projects', { headers: bearer(accessToken) }, data =>
    ProjectSchema.array().parse(data),
  )
}

export async function createProject(
  accessToken: string,
  input: ProjectCreateInput,
): Promise<Project> {
  return request(
    '/projects',
    { method: 'POST', headers: bearer(accessToken), body: JSON.stringify(input) },
    data => ProjectSchema.parse(data),
  )
}

export async function updateProject(
  accessToken: string,
  projectId: string,
  input: ProjectUpdateInput,
): Promise<Project> {
  return request(
    `/projects/${encodeURIComponent(projectId)}`,
    { method: 'PATCH', headers: bearer(accessToken), body: JSON.stringify(input) },
    data => ProjectSchema.parse(data),
  )
}
