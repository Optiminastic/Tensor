import Image from 'next/image'
import type { JSX } from 'react'

import { Card } from '@/components/ui/card'

interface MachinePhotoCardProps {
  src: string
  alt: string
}

export function MachinePhotoCard({ src, alt }: MachinePhotoCardProps): JSX.Element {
  return (
    <Card className="flex items-center justify-center p-6">
      <Image
        src={src}
        alt={alt}
        width={320}
        height={320}
        sizes="(min-width: 768px) 320px, 100vw"
        className="h-auto w-full object-contain"
      />
    </Card>
  )
}
