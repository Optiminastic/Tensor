'use client'

import { Eye, EyeOff } from 'lucide-react'
import { forwardRef, useState, type JSX } from 'react'

import { Input, type InputProps } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type PasswordInputProps = Omit<InputProps, 'type'>

/**
 * A password field you can check before you commit to it.
 *
 * Typed blind, a password is a guess twice over: once when choosing it and
 * again when repeating it. The confirm field exists to catch a typo and can
 * only report THAT the two differ, never which one is wrong - so a mismatch
 * sends somebody back to retype both, blind again.
 *
 * REVEALED PER FIELD, not once for the form. Each field owns its own state, so
 * showing the one being typed does not put the other on screen as well; on a
 * shop floor the shoulder behind you is real.
 *
 * The toggle is a button rather than a checkbox so it sits inside the field,
 * and it is type="button" because the auth forms submit on Enter - a toggle
 * that submitted the form would log you in or create your account on the way
 * to reading your own password. It is left out of the tab order: tabbing from
 * the password field should reach the next field or the submit button, which
 * is the path somebody using a keyboard actually wants.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, ...props }, ref): JSX.Element {
    const [shown, setShown] = useState(false)

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={shown ? 'text' : 'password'}
          // Room for the button, so a long password does not run under it.
          className={cn('pr-10', className)}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShown(v => !v)}
          aria-pressed={shown}
          aria-label={shown ? 'Hide password' : 'Show password'}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/15 absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-xl transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          {shown ? (
            <EyeOff className="size-4" aria-hidden />
          ) : (
            <Eye className="size-4" aria-hidden />
          )}
        </button>
      </div>
    )
  },
)
