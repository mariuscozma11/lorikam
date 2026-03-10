import { z } from "zod"

export const UpdateShippingSettingsSchema = z.object({
  free_shipping_threshold: z.number().min(0),
  is_free_shipping_enabled: z.boolean(),
})

export type UpdateShippingSettingsType = z.infer<
  typeof UpdateShippingSettingsSchema
>
