import { z } from "@medusajs/framework/zod"

export const ContactSchema = z.object({
  name: z.string().min(1, "Numele este obligatoriu").max(120),
  email: z.string().email("Email invalid"),
  phone: z.string().max(40).optional().or(z.literal("")),
  message: z.string().min(1, "Mesajul este obligatoriu").max(4000),
})

export type ContactType = z.infer<typeof ContactSchema>
