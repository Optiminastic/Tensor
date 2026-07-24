import { z } from 'zod'

export const SignInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

/**
 * Strings nobody may build a password around.
 *
 * Length and character-class rules alone happily accept `Optiminastic@1`, which
 * is exactly the kind of password an attacker guesses first. Checked as a
 * substring, case-insensitively, so `Password123!` and `myp4ssword` both fail.
 */
const BANNED_SUBSTRINGS = [
  'password',
  'passw0rd',
  'tensor',
  'optiminastic',
  'qwerty',
  'letmein',
  'welcome',
  'admin',
  'designer',
  'operator',
  '123456',
] as const

/**
 * The password policy, applied wherever a password is *chosen* — the first
 * admin at /admin, and an invitee accepting their invite. Never applied at
 * sign-in, where the rules of the day the password was set are what matter.
 *
 * 12 characters with four character classes, and no product or role words.
 * The role words are banned deliberately: this system provisions people by
 * role, so `Designer@2026` is the first thing anyone would try.
 */
export const PasswordSchema = z
  .string()
  .min(12, 'Use at least 12 characters')
  .max(128, 'Password is too long')
  .regex(/[a-z]/, 'Include a lowercase letter')
  .regex(/[A-Z]/, 'Include an uppercase letter')
  .regex(/[0-9]/, 'Include a number')
  .regex(/[^A-Za-z0-9]/, 'Include a symbol')
  .refine(
    value => !BANNED_SUBSTRINGS.some(banned => value.toLowerCase().includes(banned)),
    'Too predictable — avoid product names, role names and common words',
  )

/**
 * Setting a password: the first admin, or an invitee redeeming a link.
 *
 * There is no public sign-up. Tensor provisions accounts: the first admin
 * creates themselves once at /admin, and everyone after that is invited.
 */
export const SetPasswordSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(80),
    email: z.string().email('Please enter a valid email address'),
    password: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine(values => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type SignInInput = z.infer<typeof SignInSchema>
export type SetPasswordInput = z.infer<typeof SetPasswordSchema>
