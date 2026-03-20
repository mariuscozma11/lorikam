import { z } from "zod"

export const CreateCustomerDiscountSchema = z.object({
  customer_id: z.string().min(1),
  discount_percentage: z.number().min(0).max(100),
  is_active: z.boolean().optional().default(true),
  is_collaborator: z.boolean().optional().default(false),
  notes: z.string().optional().nullable(),
})

export type CreateCustomerDiscountType = z.infer<
  typeof CreateCustomerDiscountSchema
>

export const UpdateCustomerDiscountSchema = z.object({
  discount_percentage: z.number().min(0).max(100).optional(),
  is_active: z.boolean().optional(),
  notes: z.string().optional().nullable(),
})

export type UpdateCustomerDiscountType = z.infer<
  typeof UpdateCustomerDiscountSchema
>
