import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { JSX } from 'react'

import { ProjectManager } from '@/components/projects/project-manager'
import { auth } from '@/lib/auth'
import type { Project } from '@/lib/validators/projects'
import { listProjects } from '@/services/projects.service'

export const metadata: Metadata = { title: 'Projects' }

export const dynamic = 'force-dynamic'

/**
 * Where an admin organises work into projects.
 *
 * The redirect is UX, not security: it spares a signed-out visitor a broken
 * page. Authorization is decided by Tensor-Core, which enforces `project:read`
 * and `project:manage` on every call behind this screen.
 */
export default async function ProjectsPage(): Promise<JSX.Element> {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session) redirect('/login?callbackUrl=/dashboard/projects')

  let projects: Project[] = []
  let loadError: string | null = null

  try {
    const token = await auth.api.getToken({ headers: requestHeaders })
    projects = token?.token ? await listProjects(token.token) : []
  } catch (error) {
    // Most often a non-admin landing here: the backend refuses with 403 and we
    // show that plainly rather than pretending the list is empty.
    loadError = error instanceof Error ? error.message : 'Could not load projects.'
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-4xl">Projects</h1>
        <p className="text-muted-foreground max-w-prose text-sm text-pretty">
          Group work into projects for a brand. Designs and the people who work on them attach to a
          project later; for now it is a name, a brand, and a note.
        </p>
      </div>
      <ProjectManager initialProjects={projects} loadError={loadError} />
    </main>
  )
}
