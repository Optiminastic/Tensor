'use client'

import { useState } from 'react'

import { inspectModelFile, type ModelInspection } from '../model-colours'

export interface ModelFileState {
  file: File | null
  inspection: { result: ModelInspection | null; loading: boolean }
  choose: (file: File | null) => void
}

/**
 * The chosen model file, read on-device to detect its format and, for a 3MF,
 * its colours. `onColours` lets the form pre-fill what the file already says,
 * so the designer does not type it again.
 */
export function useModelFile(onColours: (colours: string[]) => void): ModelFileState {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ModelInspection | null>(null)
  const [loading, setLoading] = useState(false)

  async function inspect(picked: File): Promise<void> {
    setLoading(true)
    try {
      const inspection = await inspectModelFile(picked)
      setResult(inspection)
      if (inspection.format === '3mf' && inspection.colours.length > 0) {
        onColours(inspection.colours)
      }
    } catch {
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  function choose(picked: File | null): void {
    setFile(picked)
    setResult(null)
    if (picked) void inspect(picked)
  }

  return { file, inspection: { result, loading }, choose }
}
