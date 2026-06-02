import { z } from "@medusajs/framework/zod"

export const CreateCroiSchema = z.object({
  label: z.string().min(1),
  size_preset_id: z.string().nullable().optional(),
  display_order: z.number().optional().default(0),
})

export type CreateCroiType = z.infer<typeof CreateCroiSchema>

export const UpdateCroiSchema = z.object({
  label: z.string().min(1).optional(),
  size_preset_id: z.string().nullable().optional(),
  display_order: z.number().optional(),
})

export type UpdateCroiType = z.infer<typeof UpdateCroiSchema>
