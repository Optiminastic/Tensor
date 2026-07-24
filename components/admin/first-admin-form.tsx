'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'
import { useForm } from 'react-hook-form'

import { createFirstAdmin } from '@/app/admin/actions'
import { SetPasswordFields } from '@/components/admin/set-password-fields'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SetPasswordSchema, type SetPasswordInput } from '@/lib/validators/auth'
import { signInWithEmail } from '@/services/auth.service'

/** Creates the first admin, then signs them straight in. */
export function FirstAdminForm(): JSX.Element {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetPasswordInput>({
    resolver: zodResolver(SetPasswordSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  async function onSubmit(values: SetPasswordInput): Promise<void> {
    setFormError(null)

    const result = await createFirstAdmin(values)
    if (!result.ok) {
      setFormError(result.error ?? 'Something went wrong. Please try again.')
      return
    }

    // The account exists but no session does — creation happens server-side, so
    // no cookie was set. Sign in with the password they just chose.
    const signedIn = await signInWithEmail({ email: values.email, password: values.password })
    if (!signedIn.ok) {
      router.push('/login')
      return
    }

    // Hard navigation, not router.push: this runs right after a server action
    // set the session cookie, and a client-side transition can render the
    // destination before that cookie is readable server-side — which bounces
    // the brand-new admin back to /admin. A full load guarantees the cookie
    // rides along. A fresh admin's first job is to set up a brand, so land them
    // straight in the create-brand flow rather than the invite screen.
    window.location.assign('/create-brand')
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          {formError ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
              {formError}
            </p>
          ) : null}

          <SetPasswordFields register={register} errors={errors} />

          <Button type="submit" disabled={isSubmitting} className="mt-1 w-full">
            {isSubmitting ? 'Creating…' : 'Create admin account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
