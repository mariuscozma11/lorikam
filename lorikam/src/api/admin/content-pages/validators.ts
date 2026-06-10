import { z } from "@medusajs/framework/zod"

export const CreateContentPageSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Slug-ul poate conține doar litere mici, cifre și -"),
  title: z.string().min(1),
  content: z.string().nullable().optional(),
  is_published: z.boolean().optional(),
})

export type CreateContentPageType = z.infer<typeof CreateContentPageSchema>

export const UpdateContentPageSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  title: z.string().min(1).optional(),
  content: z.string().nullable().optional(),
  is_published: z.boolean().optional(),
})

export type UpdateContentPageType = z.infer<typeof UpdateContentPageSchema>
