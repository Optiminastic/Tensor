'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { DamageFormFile } from '@/lib/validators/damage-form'

export interface UploadRow {
  /** Stable for the lifetime of the row, so React keys survive a retry. */
  key: string
  name: string
  sizeBytes: number
  /** 0-100. Real transfer progress, not a spinner pretending. */
  percent: number
  state: 'uploading' | 'done' | 'failed'
  /** Tensor-Core's own sentence when it refused. */
  error?: string
}

interface UseDamageUploads {
  rows: UploadRow[]
  /** How many files the link holds, counting the ones already there. */
  stored: number
  add: (files: File[]) => void
  retry: (key: string) => void
}

interface Options {
  token: string
  /** Files already on the link from an earlier visit. */
  existing: DamageFormFile[]
  maxFiles: number
  maxFileMB: number
}

/**
 * Uploading the customer's photographs, one request each.
 *
 * ONE FILE PER REQUEST, and that is not a style choice. Tensor-Core's write
 * deadline covers the request body, so a single multipart carrying five
 * videos is one long transfer that dies as a whole - and takes four
 * successful uploads with it. Separately, each file gets its own deadline,
 * its own progress and its own retry.
 *
 * XMLHttpRequest rather than fetch, because fetch still cannot report UPLOAD
 * progress in any browser. On a phone sending a 20 MB video that is the
 * difference between a page that looks frozen for two minutes and one that
 * is visibly working.
 */
export function useDamageUploads({
  token,
  existing,
  maxFiles,
  maxFileMB,
}: Options): UseDamageUploads {
  const [rows, setRows] = useState<UploadRow[]>(() =>
    existing.map((file, i) => ({
      key: file.id,
      name: `${file.kind === 'video' ? 'Video' : 'Photo'} ${i + 1}`,
      sizeBytes: file.size_bytes,
      percent: 100,
      state: 'done' as const,
    })),
  )
  // Held outside the rows so a retry can resend the same bytes without
  // asking the customer to pick the file again.
  const [blobs] = useState<Map<string, File>>(() => new Map())

  const patch = useCallback((key: string, change: Partial<UploadRow>): void => {
    setRows(current => current.map(row => (row.key === key ? { ...row, ...change } : row)))
  }, [])

  const send = useCallback(
    (key: string, file: File): void => {
      patch(key, { state: 'uploading', percent: 0, error: undefined })
      const body = new FormData()
      body.append('file', file)

      const request = new XMLHttpRequest()
      request.open('POST', `/api/d/${encodeURIComponent(token)}/files`)
      request.upload.addEventListener('progress', event => {
        if (!event.lengthComputable) return
        // Capped at 99 until the server has answered: a progress bar that
        // reads 100% while the request is still open is a page that looks
        // finished and is not.
        patch(key, { percent: Math.min(99, Math.round((event.loaded / event.total) * 100)) })
      })
      request.addEventListener('load', () => {
        if (request.status >= 200 && request.status < 300) {
          patch(key, { state: 'done', percent: 100 })
          return
        }
        patch(key, { state: 'failed', error: refusal(request.responseText) })
      })
      request.addEventListener('error', () =>
        patch(key, { state: 'failed', error: 'That did not reach us. Check your connection.' }),
      )
      request.addEventListener('abort', () =>
        patch(key, { state: 'failed', error: 'That upload was stopped.' }),
      )
      request.send(body)
    },
    [patch, token],
  )

  // THE UPDATER STAYS PURE, and the request is started from an effect.
  //
  // Sending from inside setRows looked natural and was wrong: React invokes
  // an updater more than once - twice in development under StrictMode, and
  // again whenever it replays a render it threw away - so every file went up
  // twice, under two different keys, and the rows belonging to the discarded
  // invocation were orphaned where no progress update could reach them.
  //
  // The keys are minted out here so that both invocations of the updater
  // produce identical rows; the effect then starts whatever is 'uploading'
  // and has not been started yet.
  const add = useCallback(
    (files: File[]): void => {
      const prepared = files.map(file => ({
        key: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        file,
      }))
      for (const { key, file } of prepared) blobs.set(key, file)

      setRows(current => {
        const room = maxFiles - current.filter(r => r.state !== 'failed').length
        const next = prepared.slice(0, Math.max(0, room)).map(({ key, file }) => ({
          key,
          name: file.name,
          sizeBytes: file.size,
          percent: 0,
          // Refused here as well as at the server, so somebody on a slow
          // connection is told now rather than after two minutes of
          // uploading.
          ...(file.size > maxFileMB * 1024 * 1024
            ? {
                state: 'failed' as const,
                error: `Over ${maxFileMB} MB. Send a shorter video, or a photo instead.`,
              }
            : { state: 'uploading' as const }),
        }))
        return next.length === 0 ? current : [...current, ...next]
      })
    },
    [blobs, maxFileMB, maxFiles],
  )

  // One request per row that needs one, exactly once. startedRef is what
  // makes it exactly once across re-renders and re-run effects.
  const startedRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    for (const row of rows) {
      if (row.state !== 'uploading' || startedRef.current.has(row.key)) continue
      const file = blobs.get(row.key)
      if (!file) continue
      startedRef.current.add(row.key)
      send(row.key, file)
    }
  }, [rows, blobs, send])

  const retry = useCallback(
    (key: string): void => {
      const file = blobs.get(key)
      if (file) send(key, file)
    },
    [blobs, send],
  )

  return { rows, stored: rows.filter(r => r.state === 'done').length, add, retry }
}

/**
 * Tensor-Core's own sentence, which names what to do differently - "send a
 * photo or a video of the damage" rather than "422".
 */
function refusal(body: string): string {
  try {
    const parsed: unknown = JSON.parse(body)
    if (parsed && typeof parsed === 'object' && 'detail' in parsed) {
      const detail = (parsed as { detail?: unknown }).detail
      if (typeof detail === 'string' && detail.trim()) return detail
    }
  } catch {
    // Not JSON - a proxy's own error page, most likely.
  }
  return 'That file did not reach us. Please try again.'
}
