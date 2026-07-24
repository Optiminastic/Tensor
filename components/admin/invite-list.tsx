'use client'
import type { JSX } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import type { Invite } from '@/lib/validators/admin'

interface InviteListProps {
  invites: Invite[]
  loadError: string | null
}

type Status = { label: string; tone: 'success' | 'warning' | 'neutral' | 'outline' }

/**
 * An invite's state, derived rather than stored.
 *
 * Order matters: accepted beats revoked beats expired. An invite that was used
 * and later superseded is still "accepted" — what happened to the person is
 * what the admin needs to see.
 */
function statusOf(invite: Invite): Status {
  if (invite.accepted_at) return { label: 'Accepted', tone: 'success' }
  if (invite.revoked_at) return { label: 'Revoked', tone: 'neutral' }
  if (new Date(invite.expires_at) <= new Date()) return { label: 'Expired', tone: 'outline' }
  return { label: 'Pending', tone: 'warning' }
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function InviteList({ invites, loadError }: InviteListProps): JSX.Element {
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

  if (invites.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No invitations yet. The first one you create will appear here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitations</CardTitle>
      </CardHeader>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Email</TableHeaderCell>
            <TableHeaderCell>Role</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell className="text-right">Expires</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {invites.map(invite => {
            const status = statusOf(invite)
            return (
              <TableRow key={invite.id}>
                <TableCell>{invite.email}</TableCell>
                <TableCell className="text-muted-foreground">
                  {invite.role.replace(/_/g, ' ')}
                </TableCell>
                <TableCell>
                  <Badge tone={status.tone}>{status.label}</Badge>
                </TableCell>
                <TableCell numeric className="text-muted-foreground">
                  {formatDate(invite.expires_at)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}
