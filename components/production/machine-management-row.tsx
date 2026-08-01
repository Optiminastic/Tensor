'use client'

import { useRouter } from 'next/navigation'
import type { JSX, KeyboardEvent, MouseEvent } from 'react'

import { MACHINE_LIVE_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { MachineRecord } from '@/components/production/types'
import { useMachineStatus } from '@/components/production/use-machine-status'
import { Select } from '@/components/ui/select'
import { TableCell, TableRow } from '@/components/ui/table'

interface MachineManagementRowProps {
  brand: string
  machine: MachineRecord
}

function stopRowClick(event: MouseEvent): void {
  event.stopPropagation()
}

export function MachineManagementRow({ brand, machine }: MachineManagementRowProps): JSX.Element {
  const router = useRouter()
  const { status, pending, error, onChange } = useMachineStatus(brand, machine.id, machine.status)
  const config = MACHINE_LIVE_STATUS_CONFIG[status]
  const href = `/dashboard/${brand}/production/machines/${machine.id}`

  const openDetail = (): void => router.push(href)
  const onKeyDown = (event: KeyboardEvent<HTMLTableRowElement>): void => {
    if (event.key === 'Enter') openDetail()
  }

  return (
    <TableRow
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={onKeyDown}
      className="cursor-pointer"
      aria-label={`Open ${machine.name}`}
    >
      <TableCell className="font-medium">{machine.name}</TableCell>
      <TableCell>
        <TonePill label={config.label} tone={config.tone} />
      </TableCell>
      <TableCell className="text-muted-foreground">{machine.addedAt}</TableCell>
      <TableCell className="text-right">
        <Select
          value={status}
          disabled={pending}
          onClick={stopRowClick}
          onChange={onChange}
          aria-label={`Change status for ${machine.name}`}
          className="inline-block w-40"
        >
          <option value="online">online</option>
          <option value="offline">offline</option>
        </Select>
        {error ? (
          <p role="alert" className="text-danger mt-1 text-xs">
            {error}
          </p>
        ) : null}
      </TableCell>
    </TableRow>
  )
}
