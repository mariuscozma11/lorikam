import { z } from "@medusajs/framework/zod"

export const CreateSizePresetSchema = z.object({
  name: z.string().min(1),
  sizes: z.array(z.string().min(1)).min(1),
  display_order: z.number().optional().default(0),
})

export type CreateSizePresetType = z.infer<typeof CreateSizePresetSchema>

export const UpdateSizePresetSchema = z.object({
  name: z.string().min(1).optional(),
  sizes: z.array(z.string().min(1)).min(1).optional(),
  display_order: z.number().optional(),
})

export type UpdateSizePresetType = z.infer<typeof UpdateSizePresetSchema>
