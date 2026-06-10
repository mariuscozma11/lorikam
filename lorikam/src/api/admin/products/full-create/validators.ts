import { z } from "@medusajs/framework/zod"

export const FullCreateProductSchema = z.object({
  title: z.string().min(1),
  status: z.enum(["draft", "published"]).optional(),
  team_id: z.string().nullable().optional(),
  price: z.number().positive(),
  selections: z
    .array(
      z.object({
        croi: z.string().min(1),
        sizes: z.array(z.string().min(1)).min(1),
      })
    )
    .min(1),
  color_ids: z.array(z.string()).optional(),
  manage_inventory: z.boolean().optional(),
  description: z.string().nullable().optional(),
  customization_fields: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        type: z.enum(["text", "number"]),
        required: z.boolean().optional(),
        maxLength: z.number().optional(),
        min: z.number().optional(),
        max: z.number().optional(),
      })
    )
    .optional(),
  image_urls: z.array(z.string()).optional(),
})

export type FullCreateProductType = z.infer<typeof FullCreateProductSchema>
