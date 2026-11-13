'use client'

import { Box, Download, Loader2 } from 'lucide-react'
import type { JSX } from 'react'

import { Button } from '@/components/ui/button'
import { useProductBuild } from '@/hooks/use-product-build'
import { productBuildFileUrl } from '@/lib/product-creation'

interface BackgroundBuildButtonProps {
  brand: string
  product: string
  order: string
  label: string
}

/**
 * Builds a print file on the production worker: starts the build, checks on
 * it every few seconds, and turns into a download link when the file lands.
 * Asking again for the same order returns the file already made.
 */
export function BackgroundBuildButton({
  brand,
  product,
  order,
  label,
}: BackgroundBuildButtonProps): JSX.Element {
  const { build, error, starting, running, start } = useProductBuild(brand, product, order)

  if (build?.status === 'done') {
    return (
      <a href={productBuildFileUrl(brand, build.id)} download={build.filename} className="contents">
        <Button type="button">
          <Download className="size-4" aria-hidden /> Download 3MF
        </Button>
      </a>
    )
  }
  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" onClick={() => void start()} disabled={starting || running}>
        {starting || running ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Box className="size-4" aria-hidden />
        )}
        {starting
          ? 'Starting…'
          : running
            ? `Building ${build?.status === 'queued' ? '(queued)' : '(about 10 s)'}…`
            : build?.status === 'failed'
              ? 'Try again'
              : label}
      </Button>
      {build?.status === 'failed' || error ? (
        <p role="alert" className="text-danger max-w-72 text-right text-xs">
          {build?.error ?? error}
        </p>
      ) : null}
    </div>
  )
}
