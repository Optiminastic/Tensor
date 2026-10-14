import type { JSX } from 'react'

interface FormErrorProps {
  error: string | null
}

/** The backend's refusal, passed through verbatim, or nothing. */
export function FormError({ error }: FormErrorProps): JSX.Element | null {
  if (!error) return null
  return (
    <p role="alert" className="text-danger text-sm">
      {error}
    </p>
  )
}
