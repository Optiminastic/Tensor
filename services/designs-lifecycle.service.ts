// Server-only. Simple design settings mutations (delete, rename, notes,
// attributes, cover image), split from designs.service.ts to keep that file
// within the line budget. Reuses that module's shared `call` + header helpers.
import type { DesignAttributesInput } from '@/lib/validators/designs'
import { authHeader, call, jsonHeaders } from '@/services/designs.service'

// Permanently deletes a design and its child records (backend cascades). The
// backend enforces design:delete + brand access.
export async function deleteDesign(token: string, id: string): Promise<void> {
  await call(
    `/designs/${encodeURIComponent(id)}`,
    { method: 'DELETE', headers: authHeader(token) },
    () => undefined,
  )
}

// Soft-deletes a design: it leaves every list view except "Archived" and can be
// restored. Enforces design:delete + brand access on the backend.
export async function archiveDesign(token: string, id: string): Promise<void> {
  await call(
    `/designs/${encodeURIComponent(id)}/archive`,
    { method: 'PATCH', headers: authHeader(token) },
    () => undefined,
  )
}

// Restores an archived design back into the pipeline (as priced). design:delete.
export async function unarchiveDesign(token: string, id: string): Promise<void> {
  await call(
    `/designs/${encodeURIComponent(id)}/unarchive`,
    { method: 'PATCH', headers: authHeader(token) },
    () => undefined,
  )
}

// Renames a design. Enforces design:update + brand access on the backend; the
// caller refetches the design afterwards, so the response body is ignored.
export async function renameDesign(token: string, id: string, name: string): Promise<void> {
  await call(
    `/designs/${encodeURIComponent(id)}/name`,
    { method: 'PATCH', headers: jsonHeaders(token), body: JSON.stringify({ name }) },
    () => undefined,
  )
}

// Writes the product marketing description (design:content). An empty string
// clears it. Stored on the design and used to pre-fill the publish dialog.
export async function editDesignDescription(
  token: string,
  id: string,
  description: string,
): Promise<void> {
  await call(
    `/designs/${encodeURIComponent(id)}/description`,
    { method: 'PATCH', headers: jsonHeaders(token), body: JSON.stringify({ description }) },
    () => undefined,
  )
}

// Updates the designer notes (design:update). An empty string clears them.
export async function editDesignNotes(token: string, id: string, notes: string): Promise<void> {
  await call(
    `/designs/${encodeURIComponent(id)}/notes`,
    { method: 'PATCH', headers: jsonHeaders(token), body: JSON.stringify({ notes }) },
    () => undefined,
  )
}

// Updates the upload-metadata attributes (design:update). The backend merges
// these, preserving other attribute keys (e.g. the Shopify snapshot).
export async function editDesignAttributes(
  token: string,
  id: string,
  input: DesignAttributesInput,
): Promise<void> {
  await call(
    `/designs/${encodeURIComponent(id)}/attributes`,
    { method: 'PATCH', headers: jsonHeaders(token), body: JSON.stringify(input) },
    () => undefined,
  )
}

// Replaces the design's cover image (design:update). Multipart; Content-Type is
// left unset so fetch adds the boundary.
export async function replaceDesignPreview(token: string, id: string, file: File): Promise<void> {
  const form = new FormData()
  form.set('preview', file, file.name)
  await call(
    `/designs/${encodeURIComponent(id)}/preview`,
    { method: 'PATCH', headers: authHeader(token), body: form },
    () => undefined,
  )
}
