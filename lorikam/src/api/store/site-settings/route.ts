import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SITE_SETTING_MODULE } from "../../../modules/site-setting"

// The site_setting table also holds the outgoing-email configuration
// (email_from_address, email_reply_to) and every editable `email_*` template
// block, none of which belongs on a public endpoint. So this route serves an
// explicit whitelist instead of the whole table: a key the storefront needs
// has to be added here on purpose, and nothing `email_*` is ever exposed.
// Mirrors the keys defined in the admin screens (setari-site, imagini-site).
const PUBLIC_KEYS = [
  // Images (admin: Imagini site)
  "logo",
  "hero_image",
  "lorikam_banner",
  "fan_shop_banner",
  "about_hero",
  "about_story",
  "og_image",
  // Company details shown in the footer and on the contact page
  "company_name",
  "company_cui",
  "company_reg",
  "company_address",
  "company_email",
  "company_phone",
  "contact_intro",
  // Social links
  "social_facebook",
  "social_instagram",
  // SEO defaults
  "seo_title",
  "seo_description",
  // Analytics tags — public by nature, they ship in the page anyway
  "ga4_id",
  "meta_pixel_id",
  // Cookie banner
  "cookie_banner_enabled",
  "cookie_banner_text",
]

// GET /store/site-settings - public; returns the whitelisted settings as a flat map
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve(SITE_SETTING_MODULE)
  const settings = await service.listSiteSettings({ key: PUBLIC_KEYS })
  const map: Record<string, string | null> = {}
  for (const s of settings) map[s.key] = s.value
  res.json({ settings: map })
}
