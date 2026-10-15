'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { JSX, ReactNode } from 'react'

interface ThemeProviderProps {
  children: ReactNode
}

/**
 * Light, dark or the system's choice, across the whole app. next-themes sets
 * the `.dark` class on <html> before paint (no flash) and remembers a manual
 * choice; every token in app/globals.css already has both values.
 */
export function ThemeProvider({ children }: ThemeProviderProps): JSX.Element {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
