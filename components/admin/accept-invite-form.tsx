'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'
import { useForm } from 'react-hook-form'

import { acceptInviteAndSetPassword } from '@/app/admin/actions'
import { SetPasswordFields } from '@/components/admin/set-password-fields'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SetPasswordSchema, type SetPasswordInput } from '@/lib/validators/auth'
import { signInWithEmail } from '@/services/auth.service'

interface AcceptInviteFormProps {
  token: string
  /** Fixed by the invite. The invitee does not get to choose the address. */
  email: string
}

export function AcceptInviteForm({ token, email }: AcceptInviteFormProps): JSX.Element {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetPasswordInput>({
    resolver: zodResolver(SetPasswordSchema),
    defaultValues: { name: '', email, password: '', confirmPassword: '' },
  })

  async function onSubmit(values: SetPasswordInput): Promise<void> {
    setFormError(null)

    // The invite decides the address; the form field is only there to show it.
    const result = await acceptInviteAndSetPassword(token, { ...values, email })
    if (!result.ok) {
      setFormError(result.error ?? 'Something went wrong. Please try again.')
      return
    }

    const signedIn = await signInWithEmail({ email, password: values.password })
    if (!signedIn.ok) {
      router.push('/login')
      return
    }

    router.push('/dashboard')
    router.refresh()
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

          <SetPasswordFields register={register} errors={errors} emailReadOnly emailValue={email} />

          <Button type="submit" disabled={isSubmitting} className="mt-1 w-full">
            {isSubmitting ? 'Setting up…' : 'Set password and continue'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
