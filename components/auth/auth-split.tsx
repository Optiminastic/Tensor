import type { ReactNode, JSX } from 'react'

import { AuthPlate } from '@/components/auth/auth-plate'

/** The artwork each auth page is paired with. */
export const AUTH_PLATES = {
  /** A single pawn casting a long shadow. The first move. */
  pawn: { src: '/auth/setup-pawn.jpg', width: 728, height: 731 },
  /** A boulder and its fragments. */
  stone: { src: '/auth/auth-stone.jpg', width: 735, height: 961 },
} as const

interface AuthSplitProps {
  plate: (typeof AUTH_PLATES)[keyof typeof AUTH_PLATES]
  children: ReactNode
}

/**
 * The shared shape of every auth page: content left, artwork right.
 *
 * Three pages (`/admin`, `/login`, `/accept-invite`) are the same layout, so it
 * lives here once. The pair is centred as a unit rather than the form being
 * centred alone — the form holds the left of the column and the plate takes the
 * remaining width.
 *
 * Below `lg` the plate collapses and the content is on its own, because on a
 * phone the width belongs to the form.
 */
export function AuthSplit({ plate, children }: AuthSplitProps): JSX.Element {
  return (
    <main className="min-h-dvh px-6 py-12">
      <div className="mx-auto flex min-h-[calc(100dvh-6rem)] max-w-5xl items-center justify-center gap-10 xl:gap-16">
        <div className="flex w-full max-w-md shrink-0 flex-col gap-8">{children}</div>
        <AuthPlate {...plate} className="hidden aspect-square max-w-sm flex-1 lg:flex" />
      </div>
    </main>
  )
}
