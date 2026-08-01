'use client'

import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { deleteMachineAction } from '@/app/dashboard/machines/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { Machine } from '@/lib/validators/machines'

import { MachineForm } from './machine-form'

interface MachinesViewProps {
  machines: Machine[]
  canManage: boolean
}

/** The machines list with add / edit / delete (mutations gated by machine:manage;
 * the backend enforces it regardless). */
export function MachinesView({ machines, canManage }: MachinesViewProps): JSX.Element {
  const router = useRouter()
  const refresh = (): void => router.refresh()

  return (
    <div className="flex flex-col gap-4">
      {canManage ? (
        <div className="flex justify-end">
          <MachineForm trigger={<Button>Add machine</Button>} onSaved={refresh} />
        </div>
      ) : null}

      {machines.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              No machines yet.{canManage ? ' Add one to slice designs on it.' : ''}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {machines.map(machine => (
            <li key={machine.id}>
              <Card>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-foreground font-medium">{machine.name}</p>
                      {machine.is_default ? (
                        <span className="bg-accent-subtle text-accent rounded-full px-2 py-0.5 text-xs font-medium">
                          Default
                        </span>
                      ) : null}
                      <StatusChip status={machine.status} active={machine.is_active} />
                    </div>
                    <p className="text-muted-foreground mt-0.5 font-mono text-xs tabular-nums">
                      {machine.family} / {machine.nozzle_mm.toFixed(1)}mm / {machine.flow} /{' '}
                      {machine.layer_height_min_mm.toFixed(2)}-
                      {machine.layer_height_max_mm.toFixed(2)}
                      mm / {machine.supported_filaments.length} filaments
                    </p>
                  </div>
                  {canManage ? (
                    <div className="flex items-center gap-2">
                      <MachineForm
                        machine={machine}
                        trigger={
                          <Button variant="secondary" size="sm">
                            Edit
                          </Button>
                        }
                        onSaved={refresh}
                      />
                      <DeleteButton id={machine.id} name={machine.name} onDeleted={refresh} />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function StatusChip({ status, active }: { status: string; active: boolean }): JSX.Element {
  const online = status === 'online'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        online ? 'bg-success-subtle text-success' : 'bg-surface-muted text-muted-foreground',
      )}
    >
      {status}
      {active ? '' : ' · inactive'}
    </span>
  )
}

interface DeleteButtonProps {
  id: string
  name: string
  onDeleted: () => void
}

function DeleteButton({ id, name, onDeleted }: DeleteButtonProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirm(): Promise<void> {
    setError(null)
    setPending(true)
    const res = await deleteMachineAction(id)
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not delete the machine.')
      return
    }
    setOpen(false)
    onDeleted()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="danger" size="sm">
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete machine</DialogTitle>
          <DialogDescription>
            Delete &quot;{name}&quot;? Designs already sliced on it keep their results; new slices
            fall back to the default profile.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        ) : null}
        <Button
          variant="danger"
          size="sm"
          className="self-start"
          disabled={pending}
          onClick={() => void confirm()}
        >
          {pending ? 'Deleting…' : 'Delete machine'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
