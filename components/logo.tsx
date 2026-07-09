import { cn } from '@/lib/utils'

export interface LogoProps {
  showWordmark?: boolean
  className?: string
}

/**
 * Tensor mark — a 2×2 matrix of nodes inside precision brackets,
 * nodding to the name. Drawn in currentColor so it inherits context;
 * the leading node carries the single accent.
 */
export function Logo({ showWordmark = true, className }: LogoProps): JSX.Element {
  return (
    <span className={cn('text-foreground inline-flex items-center gap-2', className)}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
        <path
          d="M6 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h2M18 3h2a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-2"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          className="text-border-strong"
        />
        <circle cx="9.5" cy="9.5" r="1.6" className="fill-accent" />
        <circle cx="14.5" cy="9.5" r="1.6" fill="currentColor" />
        <circle cx="9.5" cy="14.5" r="1.6" fill="currentColor" />
        <circle cx="14.5" cy="14.5" r="1.6" fill="currentColor" />
      </svg>
      {showWordmark ? (
        <span className="text-[0.975rem] font-semibold tracking-tight">Tensor</span>
      ) : null}
    </span>
  )
}
