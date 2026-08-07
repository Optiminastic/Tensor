'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'
import { useForm } from 'react-hook-form'

import { inviteUser } from '@/app/admin/actions'
import { type BrandChoice, BrandMultiSelect } from '@/components/admin/brand-multi-select'
import { InviteLink } from '@/components/admin/invite-link'
import { InviteList } from '@/components/admin/invite-list'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { InviteCreateSchema, type Invite, type InviteCreateInput } from '@/lib/validators/admin'

const ROLES = [
  { value: 'DESIGNER', label: 'Designer — uploads and revises designs' },
  { value: 'PROJECT_LEAD', label: 'Project Lead — approves designs and prices' },
  { value: 'OPERATOR', label: 'Operator — runs production, cannot see costs' },
  { value: 'PERFORMANCE_MARKETER', label: 'Performance Marketer — reads pricing' },
  { value: 'ADMIN', label: 'Admin — full access, including people and costs' },
] as const

interface InviteManagerProps {
  initialInvites: Invite[]
  brands: BrandChoice[]
  loadError: string | null
}

export function InviteManager({
  initialInvites,
  brands,
  loadError,
}: InviteManagerProps): JSX.Element {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)
  // Brand access is picked outside RHF (a checkbox group), then merged on submit.
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  // Held in state, never re-fetched: the backend stores only a hash, so once
  // this is gone the only remedy is a fresh invite.
  const [issuedLink, setIssuedLink] = useState<{
    url: string
    email: string
    emailed: boolean
    emailError?: string
  } | null>(null)
  // Seeded from the server, then updated locally so a new invitation appears at
  // once. router.refresh() below reconciles it with the server; without this the
  // list would briefly read "No invitations yet" under a fresh invitation.
  const [invites, setInvites] = useState<Invite[]>(initialInvites)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteCreateInput>({
    resolver: zodResolver(InviteCreateSchema),
    defaultValues: { email: '', role: 'DESIGNER', brand_slugs: [] },
  })

  async function onSubmit(values: InviteCreateInput): Promise<void> {
    setFormError(null)
    setIssuedLink(null)

    const result = await inviteUser({ ...values, brand_slugs: selectedBrands })
    if (!result.ok || !result.data) {
      setFormError(result.error ?? 'Could not create the invitation.')
      return
    }

    const { inviteUrl, invite, emailed, emailError } = result.data

    setIssuedLink({ url: inviteUrl, email: values.email, emailed, emailError })
    // Re-inviting supersedes the old invite server-side, so drop any previous
    // pending row for this email rather than showing two entries for one person.
    setInvites(current => [
      invite,
      ...current.filter(i => i.email !== invite.email || i.accepted_at !== null),
    ])
    reset({ email: '', role: values.role, brand_slugs: [] })
    setSelectedBrands([])
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Invite someone</CardTitle>
          <CardDescription>
            You choose the email and the role. They choose their own password.
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
              <Field label="Email" htmlFor="invite-email" error={errors.email?.message}>
                <Input
                  id="invite-email"
                  type="email"
                  autoComplete="off"
                  placeholder="designer@optiminastic.com"
                  {...register('email')}
                />
              </Field>
              <Field label="Role" htmlFor="invite-role" error={errors.role?.message}>
                <Select id="invite-role" {...register('role')}>
                  {ROLES.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field
              label="Brand access"
              htmlFor="invite-brands"
              hint="The brands this member may see and work in. Admins always see every brand."
            >
              <div id="invite-brands">
                <BrandMultiSelect
                  brands={brands}
                  selected={selectedBrands}
                  onChange={setSelectedBrands}
                />
              </div>
            </Field>

            <Button type="submit" disabled={isSubmitting} className="self-start">
              {isSubmitting ? 'Creating…' : 'Create invitation'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {issuedLink ? (
        <InviteLink
          url={issuedLink.url}
          email={issuedLink.email}
          emailed={issuedLink.emailed}
          emailError={issuedLink.emailError}
        />
      ) : null}

      <InviteList invites={invites} loadError={loadError} />
    </div>
  )
}
