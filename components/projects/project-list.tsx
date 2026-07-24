'use client'
import type { JSX } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import type { Project } from '@/lib/validators/projects'

interface ProjectListProps {
  projects: Project[]
  loadError: string | null
  busyId: string | null
  onToggleArchive: (project: Project) => void
}

export function ProjectList({
  projects,
  loadError,
  busyId,
  onToggleArchive,
}: ProjectListProps): JSX.Element {
  if (loadError) {
    return (
      <Card>
        <CardContent>
          <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
            {loadError}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No projects yet. The first one you create will appear here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All projects</CardTitle>
      </CardHeader>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Brand</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell className="text-right">Action</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {projects.map(project => {
            const archived = project.status === 'archived'
            return (
              <TableRow key={project.id}>
                <TableCell className="text-foreground font-medium">{project.name}</TableCell>
                <TableCell className="text-muted-foreground capitalize">{project.brand}</TableCell>
                <TableCell>
                  <Badge tone={archived ? 'neutral' : 'success'}>
                    {archived ? 'Archived' : 'Active'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busyId === project.id}
                    onClick={() => onToggleArchive(project)}
                  >
                    {busyId === project.id ? '…' : archived ? 'Restore' : 'Archive'}
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}
