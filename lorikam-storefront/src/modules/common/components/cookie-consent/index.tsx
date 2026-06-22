import { getSiteSettings } from "@lib/data/site-settings"
import CookieConsentClient from "./client"

const DEFAULT_TEXT =
  "Folosim cookie-uri pentru a-ți oferi cea mai bună experiență pe site."

// Server component: reads admin-configured banner text/toggle, then renders
// the client banner (which handles the localStorage consent state).
export default async function CookieConsent({
  countryCode,
}: {
  countryCode: string
}) {
  const settings = await getSiteSettings()

  if (settings.cookie_banner_enabled === "0") return null

  const text = settings.cookie_banner_text || DEFAULT_TEXT
  const policyHref = `/${countryCode}/politica-cookie-uri`

  return <CookieConsentClient text={text} policyHref={policyHref} />
}
