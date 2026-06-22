import { getSiteSettings } from "@lib/data/site-settings"

const DEFAULT_TITLE =
  "Lorikam — Articole sportive și echipamente pentru echipe"
const DEFAULT_DESCRIPTION =
  "Magazin online Lorikam: tricouri, echipamente sportive personalizate și fan shop pentru echipe. Calitate și livrare în toată România."

export type SeoDefaults = {
  siteName: string
  title: string
  description: string
  ogImage: string
}

// Centralized, admin-driven SEO defaults. Pages reuse these so titles,
// descriptions and the OG image change from the admin without code edits.
export async function getSeoDefaults(): Promise<SeoDefaults> {
  const s = await getSiteSettings()
  return {
    siteName: s.company_name || "Lorikam",
    title: s.seo_title || DEFAULT_TITLE,
    description: s.seo_description || DEFAULT_DESCRIPTION,
    ogImage: s.og_image || "/lorikam-shop.jpeg",
  }
}
