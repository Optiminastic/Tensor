'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'
import { useForm } from 'react-hook-form'

import { PillButton } from '@/components/landing/pill-button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { SignInSchema, type SignInInput } from '@/lib/validators/auth'
import { signInWithEmail } from '@/services/auth.service'

export function LoginForm(): JSX.Element {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(SignInSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: SignInInput): Promise<void> {
    setFormError(null)
    const result = await signInWithEmail(values)
    if (!result.ok) {
      setFormError(result.error ?? 'Something went wrong. Please try again.')
      return
    }
    // Honour where they were headed if middleware bounced them here; otherwise
    // land on the dashboard, not the marketing page, so a fresh sign-in visibly
    // lands somewhere signed-in.
    const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl')
    router.push(callbackUrl ?? '/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {formError ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {formError}
        </p>
      ) : null}
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@optiminastic.com"
          {...register('email')}
        />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message}>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          {...register('password')}
        />
      </Field>
      <PillButton
        type="submit"
        tone="lime"
        withArrow
        disabled={isSubmitting}
        className="mt-2 w-full justify-between"
      >
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </PillButton>
    </form>
  )
}
