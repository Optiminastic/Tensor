'use client'
import type { JSX } from 'react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'

import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { SetPasswordInput } from '@/lib/validators/auth'

interface SetPasswordFieldsProps {
  register: UseFormRegister<SetPasswordInput>
  errors: FieldErrors<SetPasswordInput>
  /**
   * Fixed for an invitee: the invite decides the address, not the person. When
   * set, `emailValue` is shown as a locked value instead of an editable field.
   */
  emailReadOnly?: boolean
  /** The invite's address, displayed when `emailReadOnly` is set. */
  emailValue?: string
}

/**
 * The fields for choosing a password.
 *
 * Shared by the first admin and by an invitee, because they are doing the same
 * thing: setting a password nobody else has ever known. Neither is ever handed
 * a password to change later.
 */
export function SetPasswordFields({
  register,
  errors,
  emailReadOnly = false,
  emailValue,
}: SetPasswordFieldsProps): JSX.Element {
  return (
    <>
      <Field label="Full name" htmlFor="name" error={errors.name?.message}>
        <Input id="name" autoComplete="name" placeholder="Aarav Sharma" {...register('name')} />
      </Field>

      {emailReadOnly ? (
        // The invite fixes the address, and the server re-resolves it from the
        // invite regardless of what is submitted — so this is display, not
        // input. Rendered as a locked value rather than a read-only text field:
        // a text field with a focus ring reads as "type here" even when it
        // cannot be typed in. The hidden input only carries the value through
        // form validation.
        <Field label="Email" hint="Set by your invitation">
          <div className="border-border bg-surface-muted text-muted-foreground flex h-10 items-center rounded-md border px-3 text-sm">
            {emailValue}
          </div>
          <input type="hidden" {...register('email')} />
        </Field>
      ) : (
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@optiminastic.com"
            {...register('email')}
          />
        </Field>
      )}

      <Field
        label="Password"
        htmlFor="password"
        error={errors.password?.message}
        hint="At least 12 characters, with a capital, a number and a symbol"
      >
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••••"
          {...register('password')}
        />
      </Field>

      <Field
        label="Confirm password"
        htmlFor="confirmPassword"
        error={errors.confirmPassword?.message}
      >
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••••"
          {...register('confirmPassword')}
        />
      </Field>
    </>
  )
}
