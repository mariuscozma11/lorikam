import { z } from "@medusajs/framework/zod"

export const UpsertSiteSettingSchema = z.object({
  key: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_]+$/, "Cheia poate conține doar litere mici, cifre și _"),
  value: z.string().nullable(),
})

export type UpsertSiteSettingType = z.infer<typeof UpsertSiteSettingSchema>
