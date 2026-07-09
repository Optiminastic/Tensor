'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl')
    router.push(callbackUrl ?? '/')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sign in to Tensor</CardTitle>
        <CardDescription>Use your Tensor account to continue.</CardDescription>
      </CardHeader>
      <CardContent>
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
          <Button type="submit" disabled={isSubmitting} className="mt-1 w-full">
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
