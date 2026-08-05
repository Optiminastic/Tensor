'use client'

import { Download } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { JSX } from 'react'

import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// The H2C's build volume - see internal/bedpack.BedXMM/YMM/ZMM (Tensor-Core).
const BED_XMM = 330
const BED_YMM = 320
const BED_ZMM = 300

// WebGL must not server-render; loading it lazily also keeps three.js out of
// every other page's bundle.
const BatchPlateViewer = dynamic(
  () => import('./batch-plate-viewer').then(m => m.BatchPlateViewer),
  {
    ssr: false,
    loading: () => (
      <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm">
        Loading plate preview…
      </div>
    ),
  },
)

interface BatchPlatePreviewProps {
  batchId: string
  batchNumber: string
  plateBboxXMm: number | null
  plateBboxYMm: number | null
  plateBboxZMm: number | null
}

function plateDimensionsLabel(x: number | null, y: number | null, z: number | null): string | null {
  if (x === null || y === null || z === null) return null
  const fmt = (n: number): string => n.toFixed(1)
  return `${fmt(x)} × ${fmt(y)} × ${fmt(z)} mm combined, of the ${BED_XMM} × ${BED_YMM} × ${BED_ZMM} mm bed`
}

export function BatchPlatePreview({
  batchId,
  batchNumber,
  plateBboxXMm,
  plateBboxYMm,
  plateBboxZMm,
}: BatchPlatePreviewProps): JSX.Element {
  const previewUrl = `/api/batches/${batchId}/preview`
  const dimensions = plateDimensionsLabel(plateBboxXMm, plateBboxYMm, plateBboxZMm)
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle>Merged plate</CardTitle>
          {dimensions ? (
            <CardDescription className="font-mono text-xs tabular-nums">
              {dimensions}
            </CardDescription>
          ) : null}
        </div>
        {/* Same-origin route: the handler mints the backend token from the
            session, so no token is exposed to the browser. */}
        <a
          href={previewUrl}
          download={`${batchNumber}.stl`}
          className={buttonVariants({ variant: 'secondary', size: 'sm' })}
        >
          <Download aria-hidden />
          Download STL
        </a>
      </CardHeader>
      <CardContent className="p-0">
        <div className="bg-surface-muted border-border relative h-[420px] w-full overflow-hidden rounded-md border">
          <BatchPlateViewer modelUrl={previewUrl} />
        </div>
      </CardContent>
    </Card>
  )
}
