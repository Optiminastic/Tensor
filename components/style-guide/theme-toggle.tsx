'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

export function ThemeToggle(): JSX.Element {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle(): void {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
  }

  return (
    <Button variant="secondary" size="icon" onClick={toggle} aria-label="Toggle theme">
      {dark ? <Moon /> : <Sun />}
    </Button>
  )
}
