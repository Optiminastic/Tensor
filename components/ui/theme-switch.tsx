'use client'

import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSyncExternalStore, type JSX } from 'react'

import { cn } from '@/lib/utils'

type ThemeChoice = 'system' | 'light' | 'dark'

const CHOICES: { value: ThemeChoice; label: string; icon: LucideIcon }[] = [
  { value: 'system', label: 'Match the system', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]

const TONES = {
  /** On the dashboard and other theme surfaces. */
  default: {
    track: 'bg-surface ring-border ring-1',
    on: 'bg-landing-ink dark:bg-foreground dark:text-background text-white',
    off: 'text-muted-foreground hover:text-foreground',
  },
  /** On the landing sky, which is blue in both themes. */
  sky: {
    track: 'bg-white/15 ring-1 ring-white/25 backdrop-blur-md',
    on: 'text-landing-ink bg-white',
    off: 'text-white/85 hover:text-white',
  },
}

const noop = (): (() => void) => () => {}

/** True only after hydration, so the server never guesses the stored theme. */
function useMounted(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )
}

interface ThemeSwitchProps {
  tone?: keyof typeof TONES
  className?: string
}

/**
 * System, light or dark: three icon buttons in a rounded track, the chosen one
 * filled. A radio group to assistive tech, each option named. Before
 * hydration none is marked, since only the browser knows the stored choice.
 */
export function ThemeSwitch({ tone = 'default', className }: ThemeSwitchProps): JSX.Element {
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()
  const look = TONES[tone]
  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn('inline-flex items-center gap-0.5 rounded-full p-1', look.track, className)}
    >
      {CHOICES.map(choice => {
        const active = mounted && theme === choice.value
        return (
          <button
            key={choice.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={choice.label}
            title={choice.label}
            onClick={() => setTheme(choice.value)}
            className={cn(
              'grid size-7 place-items-center rounded-full transition-colors',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
              active ? look.on : look.off,
            )}
          >
            <choice.icon className="size-3.5" aria-hidden />
          </button>
        )
      })}
    </div>
  )
}
