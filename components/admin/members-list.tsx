'use client'

import type { JSX } from 'react'

import { type BrandChoice } from '@/components/admin/brand-multi-select'
import { EditMemberBrands } from '@/components/admin/edit-member-brands'
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
  MARKETING_HEAD: 'Marketing Head',
}

export interface MemberView {
  userId: string
  email: string | null
  name: string | null
  roles: Role[]
  brandSlugs: string[]
}

interface MembersListProps {
  members: MemberView[]
  brands: BrandChoice[]
  // The signed-in user's id, so the roster never offers to remove yourself.
  currentUserId: string | null
  // Whether the viewer is an admin (user:manage). Admins can edit brands and
  // remove anyone; a non-admin (project lead) can only remove junior members.
  actorIsAdmin: boolean
}

/**
 * The team roster: each member's identity, roles, and assigned brands. Admins can
 * change a member's brands and remove anyone (except themselves / the last admin);
 * a project lead can remove junior members only. The backend enforces all of it.
 */
export function MembersList({
  members,
  brands,
  currentUserId,
  actorIsAdmin,
}: MembersListProps): JSX.Element {
  const nameFor = new Map(brands.map(brand => [brand.slug, brand.name]))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team members</CardTitle>
        <CardDescription>Everyone with a role, and the brands they can access.</CardDescription>
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
                brands={brands}
                nameFor={nameFor}
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
  brands: BrandChoice[]
  nameFor: Map<string, string>
  isSelf: boolean
  actorIsAdmin: boolean
}

function MemberRow({ member, brands, nameFor, isSelf, actorIsAdmin }: MemberRowProps): JSX.Element {
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
        <div className="flex flex-wrap items-center gap-1.5">
          {isAdmin ? (
            <span className="text-subtle-foreground text-xs">All brands (admin)</span>
          ) : member.brandSlugs.length === 0 ? (
            <span className="text-subtle-foreground text-xs">No brand access yet</span>
          ) : (
            member.brandSlugs.map(slug => (
              <Badge key={slug} tone="outline">
                {nameFor.get(slug) ?? slug}
              </Badge>
            ))
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {actorIsAdmin && !isAdmin ? (
          <EditMemberBrands
            userId={member.userId}
            label={label}
            brands={brands}
            current={member.brandSlugs}
          />
        ) : null}
        {canRemove ? <RemoveMemberButton userId={member.userId} label={label} /> : null}
      </div>
    </li>
  )
}
