import type { JSX } from 'react'

import { RegistrySkeleton } from '@/components/production/registry-skeleton'

/** Shown while the registry is built on the server, in the registry's own shape. */
export default function RegistryLoading(): JSX.Element {
  return <RegistrySkeleton />
}
