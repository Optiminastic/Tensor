'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, type JSX, type ReactNode } from 'react'

import { Tabs, type TabItem } from '@/components/ui/tabs'

export type SettingsTab = 'workspace' | 'brand' | 'integrations'

const TABS: TabItem[] = [
  { value: 'workspace', label: 'Workspace' },
  { value: 'brand', label: 'Brand' },
  { value: 'integrations', label: 'Integrations' },
]

interface SettingsTabsProps {
  active: SettingsTab
  // Rendered on the server and passed in, so each panel keeps its own data
  // fetching instead of this component learning about brands or connections.
  workspace: ReactNode
  brand: ReactNode
  integrations: ReactNode
}

/**
 * Settings as one page with three tabs.
 *
 * There used to be two Settings in the sidebar - a workspace one and a
 * per-brand one - plus a separate Integrations area, which meant three places
 * to look for "where do I change this". They are one surface now, and the tab
 * lives in the URL (`?tab=`) rather than in component state: the OAuth
 * round-trips come back to this page and have to land on Integrations, and a
 * tab nobody can link to cannot be returned to.
 */
export function SettingsTabs({
  active,
  workspace,
  brand,
  integrations,
}: SettingsTabsProps): JSX.Element {
  const router = useRouter()
  const params = useSearchParams()

  const select = useCallback(
    (value: string): void => {
      const next = new URLSearchParams(params.toString())
      next.set('tab', value)
      // The OAuth notices belong to the redirect that set them; keeping them
      // while switching tabs would re-announce "Shopify connected" on a tab
      // that had nothing to do with it.
      next.delete('google')
      next.delete('shopify')
      next.delete('shopify_orders')
      router.replace(`?${next.toString()}`, { scroll: false })
    },
    [params, router],
  )

  return (
    <div className="flex flex-col gap-6">
      <Tabs tabs={TABS} value={active} onValueChange={select} label="Settings sections" />
      <div role="tabpanel" aria-labelledby={`tab-${active}`}>
        {active === 'workspace' ? workspace : active === 'brand' ? brand : integrations}
      </div>
    </div>
  )
}
