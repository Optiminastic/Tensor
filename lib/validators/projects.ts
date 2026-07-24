import { z } from 'zod'

/**
 * A project's brand is a free-form brand slug (brands are user-created), not a
 * fixed enum. The backend validates that the slug references a real brand.
 */
export const BrandSlugSchema = z.string().min(1, 'Choose a brand').max(120)

/** A project's lifecycle. Archived projects are hidden, not deleted. */
export const ProjectStatusSchema = z.enum(['active', 'archived'])

/** What an admin submits to create a project. */
export const ProjectCreateSchema = z.object({
  name: z.string().min(1, 'Give the project a name').max(120),
  brand: BrandSlugSchema,
  description: z.string().max(500).optional(),
})

/** A partial update — rename, re-brand, edit the note, or archive. */
export const ProjectUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  brand: BrandSlugSchema.optional(),
  description: z.string().max(500).nullable().optional(),
  status: ProjectStatusSchema.optional(),
})

/** A project as listed. Field names are snake_case to match the backend. */
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: BrandSlugSchema,
  description: z.string().nullable(),
  status: ProjectStatusSchema,
  created_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type Brand = z.infer<typeof BrandSlugSchema>
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>
export type ProjectCreateInput = z.infer<typeof ProjectCreateSchema>
export type ProjectUpdateInput = z.infer<typeof ProjectUpdateSchema>
export type Project = z.infer<typeof ProjectSchema>
