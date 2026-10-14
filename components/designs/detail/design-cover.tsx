import { Box } from 'lucide-react'
import Image from 'next/image'
import type { JSX } from 'react'

import { LayerTexture } from '../layer-texture'

interface DesignCoverProps {
  designId: string
  hasPreview: boolean
}

/** The design's cover on a printed-layer ground, as on its card in the grid. */
export function DesignCover({ designId, hasPreview }: DesignCoverProps): JSX.Element {
  return (
    <div className="bg-surface-muted ring-border relative aspect-square w-full overflow-hidden rounded-3xl ring-1">
      <LayerTexture />
      {hasPreview ? (
        <Image
          src={`/api/designs/${designId}/preview`}
          alt=""
          fill
          unoptimized
          sizes="240px"
          className="object-contain p-6"
        />
      ) : (
        <div className="text-muted-foreground relative grid h-full place-items-center">
          <span className="bg-surface ring-border grid size-16 place-items-center rounded-2xl ring-1">
            <Box className="size-7" aria-hidden />
          </span>
        </div>
      )}
    </div>
  )
}
