import Image from 'next/image'
import type { JSX } from 'react'

import { Card } from '@/components/ui/card'

interface MachinePhotoCardProps {
  src: string
  alt: string
}

export function MachinePhotoCard({ src, alt }: MachinePhotoCardProps): JSX.Element {
  return (
    <Card className="flex items-center justify-center p-3">
      <Image
        src={src}
        alt={alt}
        width={260}
        height={260}
        sizes="(min-width: 768px) 260px, 100vw"
        className="h-auto w-full object-contain"
      />
    </Card>
  )
}
