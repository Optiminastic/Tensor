'use client'

import type { JSX } from 'react'

import { DesignAddDialog } from '@/components/production/design-add-dialog'
import { TemplateUploadButton } from '@/components/production/template-upload-button'
import { TonePill } from '@/components/production/tone-pill'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import type { DesignTemplate } from '@/lib/validators/registry'

interface DesignRegistryTableProps {
  brand: string
  templates: DesignTemplate[]
}

const FIGURE = 'font-mono tabular-nums'

function kb(bytes: number): string {
  if (bytes <= 0) return '—'
  return `${Math.round(bytes / 1024).toLocaleString('en-IN')} KB`
}

function when(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

/**
 * The files products render from, how to add one, and how to replace one.
 *
 * The distinction the table exists to show is Source. "Built in" means the
 * template is compiled into the backend and can only be changed by a developer
 * and a deploy - which is how all three plank templates worked, and how they
 * silently drifted five days behind the shop's own masters. "Uploaded" means
 * somebody replaced it here and that file is what prints, from the next render
 * onward.
 *
 * Version is kept rather than overwritten, so "which file printed the planks we
 * shipped last Tuesday" stays answerable after a fix is uploaded.
 *
 * Designs live in their own tab rather than inside each product because one
 * template usually prints several variants - swapping dnp_two_heart changes
 * every two-heart variant at once - and a file shown once per product that uses
 * it invites editing the "wrong" copy of something that has only one.
 */
export function DesignRegistryTable({ brand, templates }: DesignRegistryTableProps): JSX.Element {
  const keys = templates.map(t => t.key)

  if (templates.length === 0) {
    return (
      <Card className="flex flex-col items-start gap-3 px-5 py-4">
        <p className="text-muted-foreground text-sm">
          No design templates. A template is the OpenSCAD file a generated product renders from.
        </p>
        <DesignAddDialog brand={brand} existingKeys={keys} />
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              {['Template', 'Source', 'Version', 'File', 'Size', 'Updated'].map(column => (
                <TableHeaderCell key={column} className="py-2 whitespace-nowrap">
                  {column}
                </TableHeaderCell>
              ))}
              <TableHeaderCell className="w-32 py-2">
                <span className="sr-only">Replace</span>
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map(template => (
              <TableRow key={template.key}>
                <TableCell className={`py-2 ${FIGURE}`}>{template.key}</TableCell>
                <TableCell className="py-2">
                  {template.source === 'uploaded' ? (
                    <TonePill label="Uploaded" tone="success" />
                  ) : (
                    <TonePill label="Built in" tone="muted" />
                  )}
                </TableCell>
                <TableCell className={`py-2 ${FIGURE}`}>
                  {template.version > 0 ? (
                    `v${template.version}`
                  ) : (
                    <span className="text-muted-foreground font-sans">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground py-2">
                  {template.filename || <span className="font-sans">—</span>}
                </TableCell>
                <TableCell className={`py-2 ${FIGURE}`}>{kb(template.size_bytes)}</TableCell>
                <TableCell className="text-muted-foreground py-2">
                  {when(template.created_at)}
                </TableCell>
                <TableCell className="py-2 text-right">
                  <TemplateUploadButton
                    brand={brand}
                    templateKey={template.key}
                    label={template.source === 'uploaded' ? 'Replace' : 'Upload'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <div>
        <DesignAddDialog brand={brand} existingKeys={keys} />
      </div>
    </div>
  )
}
