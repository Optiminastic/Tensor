import type { JSX, ReactNode } from 'react'

interface AuthHeadingProps {
  eyebrow: string
  title: string
  children?: ReactNode
}

/** The mono label, heading and line of explanation above every auth form. */
export function AuthHeading({ eyebrow, title, children }: AuthHeadingProps): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-xs tracking-[0.2em] uppercase">
        <span aria-hidden className="mr-2">
          •
        </span>
        {eyebrow}
      </p>
      <h1 className="text-4xl font-medium tracking-[-0.04em]">{title}</h1>
      {children ? <p className="text-landing-ink/75 text-sm text-pretty">{children}</p> : null}
    </div>
  )
}
