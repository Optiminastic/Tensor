'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'
import { useForm } from 'react-hook-form'

import { createProject, updateProject } from '@/app/dashboard/projects/actions'
import { ProjectList } from '@/components/projects/project-list'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  ProjectCreateSchema,
  type Project,
  type ProjectCreateInput,
} from '@/lib/validators/projects'

interface ProjectManagerProps {
  initialProjects: Project[]
  loadError: string | null
}

export function ProjectManager({ initialProjects, loadError }: ProjectManagerProps): JSX.Element {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  // Seeded from the server, updated locally so a new project appears at once;
  // router.refresh() reconciles with the server.
  const [projects, setProjects] = useState<Project[]>(initialProjects)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectCreateInput>({
    resolver: zodResolver(ProjectCreateSchema),
    defaultValues: { name: '', brand: 'gifting', description: '' },
  })

  async function onSubmit(values: ProjectCreateInput): Promise<void> {
    setFormError(null)
    const result = await createProject(values)
    if (!result.ok || !result.data) {
      setFormError(result.error ?? 'Could not create the project.')
      return
    }
    setProjects(current => [result.data as Project, ...current])
    reset({ name: '', brand: values.brand, description: '' })
    router.refresh()
  }

  async function onToggleArchive(project: Project): Promise<void> {
    setFormError(null)
    setBusyId(project.id)
    const next = project.status === 'archived' ? 'active' : 'archived'
    const result = await updateProject(project.id, { status: next })
    setBusyId(null)
    if (!result.ok || !result.data) {
      setFormError(result.error ?? 'Could not update the project.')
      return
    }
    setProjects(current => current.map(p => (p.id === project.id ? (result.data as Project) : p)))
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>New project</CardTitle>
          <CardDescription>
            A project belongs to one brand. You can rename or archive it later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            {formError ? (
              <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
                {formError}
              </p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="project-name" error={errors.name?.message}>
                <Input
                  id="project-name"
                  autoComplete="off"
                  placeholder="Diwali Gifting 2026"
                  {...register('name')}
                />
              </Field>
              <Field label="Brand" htmlFor="project-brand" error={errors.brand?.message}>
                <Select id="project-brand" {...register('brand')}>
                  <option value="gifting">Gifting</option>
                  <option value="decor">Decor</option>
                </Select>
              </Field>
            </div>

            <Field
              label="Description"
              htmlFor="project-description"
              hint="Optional"
              error={errors.description?.message}
            >
              <Textarea
                id="project-description"
                placeholder="What this project is for…"
                {...register('description')}
              />
            </Field>

            <Button type="submit" disabled={isSubmitting} className="self-start">
              {isSubmitting ? 'Creating…' : 'Create project'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <ProjectList
        projects={projects}
        loadError={loadError}
        busyId={busyId}
        onToggleArchive={onToggleArchive}
      />
    </div>
  )
}
