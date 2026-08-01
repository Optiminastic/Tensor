'use client'

import { useState, type JSX } from 'react'

import { updateMachineCostAction } from '@/app/dashboard/machines/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { MachineCost } from '@/lib/validators/machines'

interface MachineCostsViewProps {
  machines: MachineCost[]
}

/** Per-machine hourly cost editing. Each row saves independently. */
export function MachineCostsView({ machines }: MachineCostsViewProps): JSX.Element {
  if (machines.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-muted-foreground text-sm">No machines yet.</p>
        </CardContent>
      </Card>
    )
  }
  return (
    <ul className="flex flex-col gap-3">
      {machines.map(machine => (
        <li key={machine.id}>
          <MachineCostRow machine={machine} />
        </li>
      ))}
    </ul>
  )
}

function MachineCostRow({ machine }: { machine: MachineCost }): JSX.Element {
  const [cost, setCost] = useState(machine.machine_hour_cost)
  const [pending, setPending] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  async function save(): Promise<void> {
    setPending(true)
    setStatus(null)
    const res = await updateMachineCostAction(machine.id, cost)
    setPending(false)
    setStatus(res.ok ? 'Saved' : (res.error ?? 'Could not save.'))
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-foreground font-medium">{machine.name}</p>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">₹/hour</span>
          <Input
            type="number"
            step="1"
            min="0"
            data-numeric="true"
            className="w-28"
            value={cost}
            onChange={e => setCost(Number(e.target.value))}
          />
          <Button size="sm" disabled={pending} onClick={() => void save()}>
            {pending ? 'Saving…' : 'Save'}
          </Button>
          {status ? <span className="text-muted-foreground text-xs">{status}</span> : null}
        </div>
      </CardContent>
    </Card>
  )
}
