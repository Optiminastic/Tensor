'use client'

import { useState, type JSX } from 'react'

import { DesignAddDialog } from '@/components/production/design-add-dialog'
import { PartFilesTable } from '@/components/production/part-files-table'
import { RegistrySectionCard } from '@/components/production/registry-section-card'
import { TemplateDeleteDialog } from '@/components/production/template-delete-dialog'
import { TemplateDownloadButton } from '@/components/production/template-download-button'
import { TemplateSectionSelect } from '@/components/production/template-section-select'
import { TemplateUploadButton } from '@/components/production/template-upload-button'
import { TonePill } from '@/components/production/tone-pill'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import type { PartFile } from '@/lib/validators/part-files'
import type { DesignTemplate } from '@/lib/validators/registry'

interface DesignRegistryTableProps {
  brand: string
  templates: DesignTemplate[]
  /** The stored part files, listed as their own section. */
  partFiles: PartFile[]
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

const ROLE_WORDS: Record<string, string> = { body: 'prints', preview: 'preview' }

/** What a file is actually used for, which is not the same as where it is filed. */
function usedFor(template: DesignTemplate): string {
  return (template.used_by ?? [])
    .map(u => `${u.product_code} · ${ROLE_WORDS[u.role] ?? u.role}`)
    .join(', ')
}

/**
 * The files the registry holds, grouped by what each one is FOR.
 *
 * A flat list of .scad files could not answer the only question somebody
 * standing on this tab has - is this the file that prints, or the one the
 * customer is shown? - so each file carries a section, and the sections are
 * panels that open.
 *
 * SECTION AND "USED FOR" ARE DIFFERENT COLUMNS ON PURPOSE. Section is where
 * somebody filed the file; Used for is what products actually do with it, and
 * only the product can change that. Filing a printing file under Other moves
 * the row and changes nothing about what the shop makes - which is the whole
 * reason the dropdown writes a label instead of an assignment.
 *
 * Within a section the distinction worth seeing is Source. "Built in" means
 * the template is compiled into the backend and can only be changed by a
 * developer and a deploy - which is how all three plank templates worked, and
 * how they silently drifted five days behind the shop's own masters.
 * "Uploaded" means somebody replaced it here and that file is what prints,
 * from the next render onward. Versions are kept rather than overwritten, so
 * "which file printed the planks we shipped last Tuesday" stays answerable.
 */
export function DesignRegistryTable({
  brand,
  templates,
  partFiles,
}: DesignRegistryTableProps): JSX.Element {
  // Printing files open, the rest shut. It is the section somebody opens this
  // tab for, and four open panels is the flat list this replaced.
  const [open, setOpen] = useState<Record<string, boolean>>({ print: true })
  const toggle = (id: string): void => setOpen(current => ({ ...current, [id]: !current[id] }))
  const keys = templates.map(t => t.key)

  // WHERE A FILE SITS: the label somebody filed it under, and failing that the
  // heading its actual use implies. Automatic is right for every correctly
  // wired file and needs nobody to maintain it; the dropdown is for the rest -
  // a part's mesh, a test piece, a file whose use the screen cannot see.
  //
  // A FILED file sits under exactly ONE heading. An automatic one may sit
  // under two, because the same .scad can print a product and draw its
  // preview - which is true of this shop's lotus holder, and the reason the
  // heading is not a property of the file.
  function sits(template: DesignTemplate, section: string): boolean {
    const filed = (template.section ?? '').trim()
    if (filed !== '') return filed === section
    const roles = (template.used_by ?? []).map(u => u.role)
    if (section === 'print') return roles.includes('body')
    if (section === 'preview') return roles.includes('preview')
    return roles.length === 0
  }

  /** What the dropdown shows beside "Automatic", so the choice reads as a change. */
  function effectiveSection(template: DesignTemplate): string {
    if (sits(template, 'print')) return 'print'
    if (sits(template, 'preview')) return 'preview'
    return 'other'
  }

  const sections = [
    {
      id: 'print',
      title: 'Printing files',
      description: 'Rendered per order. What comes out goes on the bed.',
      templates: templates.filter(t => sits(t, 'print')),
      empty: 'Nothing filed here, and no product prints from a file yet.',
    },
    {
      id: 'preview',
      title: 'Personalisation preview files',
      description: 'Drawn for the customer during the thirty-minute link, never printed.',
      templates: templates.filter(t => sits(t, 'preview')),
      empty: 'Nothing here. Without one, the customer sees a picture of what prints.',
    },
    {
      id: 'other',
      title: 'Other',
      description: 'A part’s mesh, a test piece, or a file waiting for its product.',
      templates: templates.filter(t => sits(t, 'other')),
      empty: 'Nothing here.',
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {sections.map(section => (
        <RegistrySectionCard
          key={section.id}
          title={section.title}
          description={section.description}
          count={section.templates.length}
          open={open[section.id] ?? false}
          onToggle={() => toggle(section.id)}
        >
          {section.templates.length === 0 ? (
            <p className="text-muted-foreground px-5 py-4 text-sm">{section.empty}</p>
          ) : (
            <Table dense>
              <TableHead>
                <TableRow>
                  {['Template', 'Section', 'Used for', 'Source', 'Updated'].map(column => (
                    <TableHeaderCell key={column} className="whitespace-nowrap">
                      {column}
                    </TableHeaderCell>
                  ))}
                  <TableHeaderCell className="w-40 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {section.templates.map(template => (
                  <TableRow key={template.key}>
                    {/* The key and the file it reads as one cell: they are two
                        halves of "which file is this", and two columns apart
                        made somebody track across the row to pair them. */}
                    <TableCell>
                      <div className="flex flex-col items-start gap-0.5">
                        <span className={`text-sm ${FIGURE}`}>{template.key}</span>
                        <span className="text-subtle-foreground max-w-56 truncate text-xs">
                          {template.filename || 'built in'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <TemplateSectionSelect
                        brand={brand}
                        template={template}
                        effective={effectiveSection(template)}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-56 text-sm text-balance">
                      {usedFor(template) || '—'}
                    </TableCell>
                    {/* Source and version together: a version number means
                        nothing without knowing whether the file is one
                        somebody uploaded or one the binary ships. */}
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {template.source === 'uploaded' ? (
                          <TonePill label="Uploaded" tone="success" />
                        ) : (
                          <TonePill label="Built in" tone="muted" />
                        )}
                        {template.version > 0 ? (
                          <span className={`text-subtle-foreground text-xs ${FIGURE}`}>
                            v{template.version}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="text-sm">{when(template.created_at)}</span>
                        <span className={`text-subtle-foreground text-xs ${FIGURE}`}>
                          {kb(template.size_bytes)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {/* Download first: reading a template is what somebody
                          does before replacing one, and the destructive action
                          should not be the one under the thumb. */}
                      <div className="flex items-center justify-end gap-1">
                        <TemplateDownloadButton templateKey={template.key} />
                        <TemplateUploadButton
                          brand={brand}
                          templateKey={template.key}
                          label={template.source === 'uploaded' ? 'Replace' : 'Upload'}
                        />
                        {/* Built-in files have no row to remove: they are
                            compiled into the binary, and the delete says so
                            rather than failing after the click. */}
                        {template.source === 'uploaded' ? (
                          <TemplateDeleteDialog brand={brand} template={template} />
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </RegistrySectionCard>
      ))}

      <RegistrySectionCard
        title="Part files"
        description="Finished files for the pieces a product is made of. Stored, never opened."
        count={partFiles.length}
        open={open.parts ?? false}
        onToggle={() => toggle('parts')}
      >
        <PartFilesTable files={partFiles} />
      </RegistrySectionCard>

      <div className="pt-1">
        <DesignAddDialog brand={brand} existingKeys={keys} />
      </div>
    </div>
  )
}
