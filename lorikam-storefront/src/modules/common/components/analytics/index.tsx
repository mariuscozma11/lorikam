import { getSiteSettings } from "@lib/data/site-settings"
import AnalyticsClient from "./client"

// Server component: reads admin-configured analytics IDs, then renders the
// consent-gated client loader. No IDs → nothing is rendered.
export default async function Analytics() {
  const settings = await getSiteSettings()
  const ga4Id = settings.ga4_id
  const metaPixelId = settings.meta_pixel_id

  if (!ga4Id && !metaPixelId) return null

  return <AnalyticsClient ga4Id={ga4Id} metaPixelId={metaPixelId} />
}
