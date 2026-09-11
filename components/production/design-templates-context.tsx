'use client'

import { createContext, useContext, type JSX, type ReactNode } from 'react'

import type { DesignTemplate } from '@/lib/validators/registry'

/**
 * The design files on offer, available to anything that needs to choose one.
 *
 * A context rather than a prop, because the only consumer is the dialog that
 * links a variant to a design - three components below the page that loads the
 * list. Threading it through the product panel and the variant table would make
 * both carry a value neither of them reads.
 *
 * Defaults to empty rather than throwing when there is no provider: a variant
 * table rendered without one should show "no designs to choose from", which is
 * a true statement, not crash.
 */
const DesignTemplatesContext = createContext<DesignTemplate[]>([])

export function DesignTemplatesProvider({
  templates,
  children,
}: {
  templates: DesignTemplate[]
  children: ReactNode
}): JSX.Element {
  return (
    <DesignTemplatesContext.Provider value={templates}>{children}</DesignTemplatesContext.Provider>
  )
}

/** The design files a variant can be linked to. */
export function useDesignTemplates(): DesignTemplate[] {
  return useContext(DesignTemplatesContext)
}
