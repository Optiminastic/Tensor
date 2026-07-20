import { signIn, signOut } from '@/lib/auth-client'
import type { SignInInput } from '@/lib/validators/auth'

export interface AuthResult {
  ok: boolean
  error?: string
}

/**
 * Signing in is the only auth action a browser may start.
 *
 * There is deliberately no `signUpWithEmail` here. Tensor provisions accounts:
 * the first admin creates themselves once at /admin, and everyone after that is
 * invited by an admin and sets their password through an invite link. Account
 * creation happens in a server action, never from the browser, and
 * `/api/auth/sign-up/email` is blocked at the route.
 */
export async function signInWithEmail(input: SignInInput): Promise<AuthResult> {
  const result = await signIn.email(input)
  if (result.error) {
    return { ok: false, error: result.error.message ?? 'Invalid credentials. Please try again.' }
  }
  return { ok: true }
}

export async function signOutCurrentUser(): Promise<void> {
  await signOut()
}
