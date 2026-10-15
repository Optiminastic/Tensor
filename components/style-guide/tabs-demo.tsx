'use client'

import { useState, type JSX } from 'react'

import { Tabs } from '@/components/ui/tabs'

const TABS = [
  { value: 'all', label: 'All', count: 64 },
  { value: 'unfulfilled', label: 'Unfulfilled', count: 12 },
  { value: 'done', label: 'Done', count: 52 },
]

/** The pill tabs, live, so the selection can be tried. */
export function TabsDemo(): JSX.Element {
  const [tab, setTab] = useState('all')
  return <Tabs tabs={TABS} value={tab} onValueChange={setTab} label="Example tabs" />
}
