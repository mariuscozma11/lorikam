import Image from "next/image"
import { Text } from "@medusajs/ui"

import { getTeams } from "@lib/data/teams"
import { getSiteSettings } from "@lib/data/site-settings"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SOCIAL_ICONS = {
  facebook: (
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987H7.898v-2.89h2.54V9.797c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
  ),
  instagram: (
    <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 011.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772 4.915 4.915 0 01-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.802c-2.67 0-2.986.01-4.04.058-.976.045-1.505.207-1.858.344-.466.182-.8.398-1.15.748-.35.35-.566.684-.748 1.15-.137.353-.3.882-.344 1.857-.048 1.055-.058 1.37-.058 4.041 0 2.67.01 2.986.058 4.04.045.976.207 1.505.344 1.858.182.466.399.8.748 1.15.35.35.684.566 1.15.748.353.137.882.3 1.857.344 1.055.048 1.37.058 4.041.058 2.67 0 2.987-.01 4.04-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041 0-2.67-.01-2.986-.058-4.04-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.055-.048-1.37-.058-4.041-.058zm0 3.063a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 8.468a3.333 3.333 0 100-6.666 3.333 3.333 0 000 6.666zm6.538-8.671a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z" />
  ),
} as const

export default async function Footer() {
  const [teams, settings] = await Promise.all([getTeams(), getSiteSettings()])

  const logo = settings.logo || "/logo-retina.png"
  const companyName = settings.company_name || "Lorikam"
  const socials = [
    { name: "Facebook", href: settings.social_facebook, icon: SOCIAL_ICONS.facebook },
    { name: "Instagram", href: settings.social_instagram, icon: SOCIAL_ICONS.instagram },
  ].filter((s) => !!s.href)

  const companyDetails = [
    settings.company_cui && `CUI ${settings.company_cui}`,
    settings.company_reg,
    settings.company_address,
    settings.company_email,
    settings.company_phone,
  ].filter(Boolean) as string[]

  return (
    <footer className="border-t border-ui-border-base w-full">
      <div className="content-container flex flex-col w-full">
        <div className="grid grid-cols-1 gap-10 small:grid-cols-2 medium:grid-cols-4 py-16">
          {/* Brand + social */}
          <div className="flex flex-col gap-y-4">
            <LocalizedClientLink href="/" className="inline-flex">
              <Image
                src={logo}
                alt="Lorikam"
                width={446}
                height={104}
                className="h-10 w-auto"
              />
            </LocalizedClientLink>
            <Text className="txt-small text-ui-fg-subtle max-w-xs">
              Articole sportive de calitate pentru performanța ta.
            </Text>
            {socials.length > 0 && (
              <div className="flex items-center gap-x-4 mt-2">
                {socials.map((social) => (
                  <a
                    key={social.name}
                    href={social.href as string}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.name}
                    className="text-ui-fg-subtle hover:text-ui-fg-base transition-colors"
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      {social.icon}
                    </svg>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Fan Shop */}
          <div className="flex flex-col gap-y-3">
            <span className="txt-small-plus text-ui-fg-base">Fan Shop</span>
            <ul className="grid grid-cols-1 gap-2 text-ui-fg-subtle txt-small">
              <li>
                <LocalizedClientLink
                  href="/fan-shop"
                  className="hover:text-ui-fg-base"
                >
                  Toate echipele
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/lorikam"
                  className="hover:text-ui-fg-base"
                >
                  Lorikam Shop
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/store"
                  className="hover:text-ui-fg-base"
                >
                  Toate produsele
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/about"
                  className="hover:text-ui-fg-base"
                >
                  Despre noi
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/contact"
                  className="hover:text-ui-fg-base"
                >
                  Contact
                </LocalizedClientLink>
              </li>
            </ul>
          </div>

          {/* Teams */}
          <div className="flex flex-col gap-y-3">
            <span className="txt-small-plus text-ui-fg-base">Echipe</span>
            {teams && teams.length > 0 ? (
              <ul className="grid grid-cols-1 gap-2 text-ui-fg-subtle txt-small">
                {teams.slice(0, 8).map((team) => (
                  <li key={team.id}>
                    <LocalizedClientLink
                      href={`/fan-shop/${team.handle}`}
                      className="hover:text-ui-fg-base"
                    >
                      {team.name}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            ) : (
              <Text className="txt-small text-ui-fg-muted">
                Nicio echipă disponibilă încă.
              </Text>
            )}
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-y-3">
            <span className="txt-small-plus text-ui-fg-base">Legal</span>
            <ul className="grid grid-cols-1 gap-2 text-ui-fg-subtle txt-small">
              <li>
                <LocalizedClientLink
                  href="/termeni-si-conditii"
                  className="hover:text-ui-fg-base"
                >
                  Termeni și condiții
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/politica-de-confidentialitate"
                  className="hover:text-ui-fg-base"
                >
                  Politica de confidențialitate
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/politica-cookie-uri"
                  className="hover:text-ui-fg-base"
                >
                  Politica de cookie-uri
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/retururi"
                  className="hover:text-ui-fg-base"
                >
                  Retururi și rambursări
                </LocalizedClientLink>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col w-full mb-8 pt-6 border-t border-ui-border-base gap-3 text-ui-fg-muted">
          {companyDetails.length > 0 && (
            <Text className="txt-compact-small">
              {companyName} · {companyDetails.join(" · ")}
            </Text>
          )}
          <div className="flex flex-col small:flex-row gap-2 justify-between">
            <Text className="txt-compact-small">
              © {new Date().getFullYear()} {companyName}. Toate drepturile
              rezervate.
            </Text>
            <div className="flex gap-x-4 txt-compact-small">
              <a
                href="https://anpc.ro/ce-este-sal/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-ui-fg-base"
              >
                ANPC SAL
              </a>
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noreferrer"
                className="hover:text-ui-fg-base"
              >
                ANPC SOL
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
