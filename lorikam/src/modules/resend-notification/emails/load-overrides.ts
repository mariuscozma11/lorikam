import { SITE_SETTING_MODULE } from "../../site-setting"
import type { EmailOverrides } from "./templates"

// Email copy overrides live in the generic site_setting key/value store, so
// editing them needs no migration. Keys look like email_order_placed_subject.
export async function loadEmailOverrides(
  container: { resolve: (key: string) => any }
): Promise<EmailOverrides> {
  try {
    const siteSettingService = container.resolve(SITE_SETTING_MODULE)
    const settings = await siteSettingService.listSiteSettings({})

    return Object.fromEntries(
      settings
        // company_email rides along so templates can point people at a real
        // inbox — the Resend sender doesn't receive mail.
        .filter(
          (s: any) => s.key?.startsWith("email_") || s.key === "company_email"
        )
        .map((s: any) => [s.key, s.value])
    )
  } catch {
    // Never let a settings lookup stop an order confirmation going out.
    return {}
  }
}
