import { z } from "zod"

export const UpdateEmailTemplatesSchema = z.object({
  // Flat map of override key -> value, e.g. email_order_placed_subject.
  values: z.record(z.string(), z.string()),
})

export type UpdateEmailTemplatesType = z.infer<
  typeof UpdateEmailTemplatesSchema
>

export const SendTestEmailSchema = z.object({
  to: z.string().email(),
  template: z.string().optional(),
})

export type SendTestEmailType = z.infer<typeof SendTestEmailSchema>
