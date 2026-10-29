'use client'

import type { JSX } from 'react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import { Tag } from '@/components/ui/tag'
import type { PartFile } from '@/lib/validators/part-files'

interface PartFilesTableProps {
  files: PartFile[]
}

const FIGURE = 'font-mono tabular-nums'

function kb(bytes: number): string {
  if (bytes <= 0) return '—'
  return `${Math.round(bytes / 1024).toLocaleString('en-IN')} KB`
}

/**
 * The third kind of file the registry holds: a finished file kept for a part.
 *
 * NOTHING IN TENSOR OPENS THESE. The routes behind them are upload, list and
 * delete, and no render or dispatch path reads the table. The shop keeps the
 * finished plate for a part so that printing more of them is sending a saved
 * file rather than arranging and slicing a bed again, and keeps the mesh it
 * came from beside it.
 *
 * READ-ONLY here on purpose. A part file is addressed by a component, a SKU
 * and a machine class, and all three are on screen where it is uploaded - on
 * the product's Components section. A second place to replace one is a second
 * place to replace the wrong one.
 */
export function PartFilesTable({ files }: PartFilesTableProps): JSX.Element {
  if (files.length === 0) {
    return (
      <p className="text-muted-foreground px-5 py-4 text-sm">
        No part files. These are the finished files for the pieces a product is made of — a sliced{' '}
        <code className="font-mono text-xs">.gcode</code>, the{' '}
        <code className="font-mono text-xs">.3mf</code> it came from, or the{' '}
        <code className="font-mono text-xs">.stl</code> it was modelled as. Upload them on a
        product&rsquo;s Components section.
      </p>
    )
  }

  return (
    <Table dense>
      <TableHead>
        <TableRow>
          {['Part', 'For', 'Machine', 'File', 'Kind', 'Size'].map(column => (
            <TableHeaderCell key={column} className="py-2 whitespace-nowrap">
              {column}
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {files.map(file => (
          <TableRow key={file.id}>
            <TableCell className="py-2">
              <div className="flex flex-col items-start">
                <span>{file.item_name}</span>
                {file.item_code ? (
                  <span className={`text-subtle-foreground text-xs ${FIGURE}`}>
                    {file.item_code}
                  </span>
                ) : null}
              </div>
            </TableCell>
            {/* An empty SKU is not missing data: it is the file that serves
                  every colourway, which is how a shared part is stored. */}
            <TableCell className="py-2 whitespace-nowrap">
              {file.sku ? (
                <span className={`text-sm ${FIGURE}`}>{file.sku}</span>
              ) : (
                <span className="text-muted-foreground text-sm">Every SKU</span>
              )}
            </TableCell>
            <TableCell className={`py-2 ${FIGURE}`}>{file.machine_family}</TableCell>
            <TableCell className="text-muted-foreground max-w-64 truncate py-2">
              {file.filename}
            </TableCell>
            <TableCell className="py-2">
              {/* A .stl among sliced plates is worth seeing at a glance: it
                    is the source mesh, and nothing can print it as it stands. */}
              <Tag tone={file.kind === 'stl' ? 'muted' : 'accent'}>{file.kind}</Tag>
            </TableCell>
            <TableCell className={`py-2 ${FIGURE}`}>{kb(file.size_bytes)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
