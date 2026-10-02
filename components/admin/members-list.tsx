'use client'

import type { JSX } from 'react'

import { RemoveMemberButton } from '@/components/admin/remove-member-button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Role } from '@/lib/validators/authz'

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  DESIGNER: 'Designer',
  PROJECT_LEAD: 'Project Lead',
  PERFORMANCE_MARKETER: 'Performance Marketer',
  OPERATOR: 'Operator',
  PACKAGING_QC: 'Packaging / QC',
}

export interface MemberView {
  userId: string
  email: string | null
  name: string | null
  roles: Role[]
}

interface MembersListProps {
  members: MemberView[]
  // The signed-in user's id, so the roster never offers to remove yourself.
  currentUserId: string | null
  // Whether the viewer is an admin (user:manage). Admins can
  // remove anyone; a non-admin (project lead) can only remove junior members.
  actorIsAdmin: boolean
}

/**
 * The team roster: each member's identity and roles. Admins can remove anyone
 * (except themselves / the last admin);
 * a project lead can remove junior members only. The backend enforces all of it.
 */
export function MembersList({
  members,
  currentUserId,
  actorIsAdmin,
}: MembersListProps): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team members</CardTitle>
        <CardDescription>Everyone with a role. Every role can access every store.</CardDescription>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-muted-foreground text-sm">No members yet.</p>
        ) : (
          <ul className="divide-border flex flex-col divide-y">
            {members.map(member => (
              <MemberRow
                key={member.userId}
                member={member}
                isSelf={member.userId === currentUserId}
                actorIsAdmin={actorIsAdmin}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

interface MemberRowProps {
  member: MemberView
  isSelf: boolean
  actorIsAdmin: boolean
}

function MemberRow({ member, isSelf, actorIsAdmin }: MemberRowProps): JSX.Element {
  const isAdmin = member.roles.includes('ADMIN')
  const isLead = member.roles.includes('PROJECT_LEAD')
  const label = member.email ?? member.name ?? member.userId
  // Admin removes anyone; a project lead removes only juniors (not admins/leads).
  const canRemove = !isSelf && (actorIsAdmin || (!isAdmin && !isLead))

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="truncate text-sm font-medium">
          {label}
          {isSelf ? <span className="text-subtle-foreground ml-2 text-xs">(you)</span> : null}
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {member.roles.map(role => (
            <Badge key={role} tone="accent">
              {ROLE_LABELS[role]}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {canRemove ? <RemoveMemberButton userId={member.userId} label={label} /> : null}
      </div>
    </li>
  )
}
