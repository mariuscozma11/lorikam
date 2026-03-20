import { z } from "@medusajs/framework/zod"

export const CreateColorSchema = z.object({
  name: z.string().min(1),
  hex_codes: z.array(z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/)).min(1),
  display_order: z.number().optional().default(0),
})

export type CreateColorType = z.infer<typeof CreateColorSchema>

export const UpdateColorSchema = z.object({
  name: z.string().min(1).optional(),
  hex_codes: z.array(z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/)).min(1).optional(),
  display_order: z.number().optional(),
})

export type UpdateColorType = z.infer<typeof UpdateColorSchema>

export const LinkProductColorsSchema = z.object({
  color_ids: z.array(z.string()),
})

export type LinkProductColorsType = z.infer<typeof LinkProductColorsSchema>
