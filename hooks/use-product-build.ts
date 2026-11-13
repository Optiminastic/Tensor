'use client'

import { useCallback, useEffect, useState } from 'react'

import { type ProductBuild, readProductBuild, startProductBuild } from '@/lib/product-creation'

const POLL_MS = 1500

interface ProductBuildState {
  build: ProductBuild | null
  error: string | null
  starting: boolean
  running: boolean
  start: () => Promise<void>
}

/**
 * A background build of one product's print file for one order: start it,
 * check on it every moment or so until it is done or failed. Starting again
 * for the same order returns the build already made.
 */
export function useProductBuild(brand: string, product: string, order: string): ProductBuildState {
  const [build, setBuild] = useState<ProductBuild | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  const running = build?.status === 'queued' || build?.status === 'building'
  useEffect(() => {
    if (!build || !running) return
    const timer = setTimeout(() => {
      void readProductBuild(brand, build.id).then(res => {
        if (!('id' in res)) setError(res.error)
        else setBuild(res)
      })
    }, POLL_MS)
    return () => clearTimeout(timer)
  }, [brand, build, running])

  const start = useCallback(async (): Promise<void> => {
    setError(null)
    setStarting(true)
    const res = await startProductBuild(brand, product, order)
    setStarting(false)
    if (!('id' in res)) setError(res.error)
    else setBuild(res)
  }, [brand, product, order])

  return { build, error, starting, running, start }
}
