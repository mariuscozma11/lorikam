import { z } from "zod"

export const CreateShippingMethodSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price_ron: z.number().min(0),
  price_eur: z.number().min(0).optional(),
  is_enabled: z.boolean().optional(),
})

export type CreateShippingMethodType = z.infer<
  typeof CreateShippingMethodSchema
>

export const UpdateShippingMethodSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price_ron: z.number().min(0).optional(),
  price_eur: z.number().min(0).optional(),
  is_enabled: z.boolean().optional(),
})

export type UpdateShippingMethodType = z.infer<
  typeof UpdateShippingMethodSchema
>
