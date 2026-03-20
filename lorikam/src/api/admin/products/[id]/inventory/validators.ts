import { z } from "zod"

export const VariantInventoryUpdateSchema = z.object({
  variant_id: z.string(),
  manage_inventory: z.boolean(),
  stocked_quantity: z.number().int().min(0).optional(),
})

export const UpdateProductInventorySchema = z.object({
  location_id: z.string(),
  updates: z.array(VariantInventoryUpdateSchema).min(1),
})

export type UpdateProductInventoryType = z.infer<typeof UpdateProductInventorySchema>
