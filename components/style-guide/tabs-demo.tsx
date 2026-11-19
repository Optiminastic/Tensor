'use client'

import { useState, type JSX } from 'react'

import { Tabs, type TabItem } from '@/components/ui/tabs'

const TABS: TabItem[] = [
  { value: 'products', label: 'Products', count: 19 },
  { value: 'components', label: 'Components', count: 2 },
  { value: 'designs', label: 'Designs', count: 42 },
  { value: 'slicing', label: 'Slicing' },
]

/** The pill tabs, clickable, as every page in the workspace uses them. */
export function TabsDemo(): JSX.Element {
  const [tab, setTab] = useState('products')
  return <Tabs tabs={TABS} value={tab} onValueChange={setTab} label="Example tabs" />
}
