import { z } from "@medusajs/framework/zod"

export const BuildVariantsSchema = z.object({
  selections: z
    .array(
      z.object({
        croi: z.string().min(1),
        sizes: z.array(z.string().min(1)).min(1),
      })
    )
    .min(1),
  price: z.number().optional(),
  manage_inventory: z.boolean().optional(),
})

export type BuildVariantsType = z.infer<typeof BuildVariantsSchema>
