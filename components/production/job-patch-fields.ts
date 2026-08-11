import type { Role } from '@/lib/validators/authz'

export type JobPatchField =
  | 'status'
  | 'assembly_status'
  | 'qc_status'
  | 'packaging_status'
  | 'batch_id'
  | 'priority'
  | 'held'

const ALL_FIELDS: JobPatchField[] = [
  'status',
  'assembly_status',
  'qc_status',
  'packaging_status',
  'batch_id',
  'priority',
  'held',
]

// Mirrors Tensor-Core's patchFieldsByRole (internal/production/lifecycle.go).
// UX only - it lets the edit dialog show just the fields a role can actually
// change; the backend re-enforces this against the verified token regardless
// (see CLAUDE.md), so a field hidden here is never a security boundary.
const FIELDS_BY_ROLE: Partial<Record<Role, JobPatchField[]>> = {
  ADMIN: ALL_FIELDS,
  PROJECT_LEAD: ALL_FIELDS,
  OPERATOR: ['status'],
  PACKAGING_QC: [],
}

/** The union of PATCH-able job fields across the caller's roles. */
export function allowedJobPatchFields(roles: Role[]): Set<JobPatchField> {
  const out = new Set<JobPatchField>()
  for (const role of roles) {
    for (const field of FIELDS_BY_ROLE[role] ?? []) out.add(field)
  }
  return out
}
