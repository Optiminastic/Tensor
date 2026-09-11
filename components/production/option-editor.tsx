'use client'

import { Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import {
  addOption,
  addOptionValue,
  removeOption,
  removeOptionValue,
} from '@/app/dashboard/[brand]/production/registry-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ProductOption } from '@/lib/validators/registry'

interface OptionEditorProps {
  brand: string
  productCode: string
  options: ProductOption[]
}

/**
 * The axes a product varies on, and the answers allowed on each.
 *
 * This is the screen that stops a new colour being a deploy. `heart_count` and
 * `light` used to live in Go constants, so adding "3 hearts" meant a developer,
 * a recompile and a release; here it is two fields and a save.
 *
 * Code and label are both asked for because they are different jobs. The code
 * is what an order resolves against and must stay stable; the label is what a
 * person reads and can be reworded freely. Deriving one from the other would
 * mean renaming "With light" to "Lit" silently broke every order that matched
 * on it.
 */
export function OptionEditor({ brand, productCode, options }: OptionEditorProps): JSX.Element {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [code, setCode] = useState('')
  const [label, setLabel] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(): Promise<void> {
    setPending(true)
    setError(null)
    const res = await addOption(brand, productCode, {
      code: code.trim(),
      label: label.trim(),
      position: options.length,
    })
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not add the option.')
      return
    }
    setCode('')
    setLabel('')
    setAdding(false)
    router.refresh()
  }

  async function drop(id: string): Promise<void> {
    setError(null)
    const res = await removeOption(brand, id)
    if (!res.ok) {
      setError(res.error ?? 'Could not delete the option.')
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-subtle-foreground text-[10px] font-medium tracking-wide uppercase">
          Options
        </h3>
        <Button variant="ghost" size="sm" onClick={() => setAdding(open => !open)}>
          <Plus className="size-3.5" aria-hidden />
          Option
        </Button>
      </div>

      {options.length === 0 && !adding ? (
        <p className="text-muted-foreground text-sm">
          No options yet. An option is one axis this product varies on — hearts, light, colour.
        </p>
      ) : null}

      {options.map(option => (
        <OptionRow
          key={option.id}
          brand={brand}
          option={option}
          onDelete={() => void drop(option.id)}
        />
      ))}

      {adding ? (
        <div className="border-border flex flex-wrap items-end gap-2 rounded-md border border-dashed p-2">
          <Input
            aria-label="Option code"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="code e.g. colour"
            className="w-40"
          />
          <Input
            aria-label="Option label"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="label e.g. Colour"
            className="w-40"
          />
          <Button
            size="sm"
            onClick={() => void save()}
            disabled={pending || code.trim() === '' || label.trim() === ''}
          >
            {pending ? 'Saving…' : 'Add'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setAdding(false)} disabled={pending}>
            Cancel
          </Button>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** One axis, its values, and the controls to change them. */
function OptionRow({
  brand,
  option,
  onDelete,
}: {
  brand: string
  option: ProductOption
  onDelete: () => void
}): JSX.Element {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [pending, setPending] = useState(false)

  async function addValue(): Promise<void> {
    const label = value.trim()
    if (label === '') return
    setPending(true)
    // The code is derived from the label here, unlike the option itself: a
    // value is typed far more often, and "With light" -> "with_light" is the
    // convention the seeded data already follows. It stays editable in the
    // payload, so a deliberate code is still possible via the API.
    const res = await addOptionValue(brand, option.id, {
      code: label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, ''),
      label,
      position: option.values.length,
    })
    setPending(false)
    if (!res.ok) return
    setValue('')
    router.refresh()
  }

  async function dropValue(id: string): Promise<void> {
    const res = await removeOptionValue(brand, id)
    if (res.ok) router.refresh()
  }

  return (
    <div className="border-border flex flex-col gap-2 rounded-md border px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">{option.label}</span>
          <span className="text-subtle-foreground font-mono text-xs">{option.code}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onDelete} aria-label={`Delete ${option.label}`}>
          <X className="size-3.5" aria-hidden />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {option.values.map(v => (
          <span
            key={v.id}
            className="bg-surface-muted text-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
          >
            {v.label}
            <button
              type="button"
              onClick={() => void dropValue(v.id)}
              aria-label={`Remove ${v.label}`}
              className="text-muted-foreground hover:text-danger"
            >
              <X className="size-3" aria-hidden />
            </button>
          </span>
        ))}
        <Input
          aria-label={`Add a value to ${option.label}`}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void addValue()
            }
          }}
          placeholder="add a value"
          disabled={pending}
          className="h-7 w-36 text-xs"
        />
      </div>
    </div>
  )
}
