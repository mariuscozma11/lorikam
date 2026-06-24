import { Metadata } from "next"
import { getSiteSettings } from "@lib/data/site-settings"
import Breadcrumbs from "@modules/common/components/breadcrumbs"
import ContactForm from "@modules/content/components/contact-form"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactează echipa Lorikam. Suntem aici pentru întrebări despre produse, comenzi și colaborări.",
}

export default async function ContactPage() {
  const s = await getSiteSettings()

  const company = s.company_name || "Lorikam"
  const email = s.company_email
  const phone = s.company_phone
  const address = s.company_address
  const intro =
    s.contact_intro ||
    "Ai o întrebare despre produse, o comandă sau o colaborare? Scrie-ne și revenim cât mai repede."

  const details: { label: string; value: string; href?: string }[] = []
  if (email) details.push({ label: "Email", value: email, href: `mailto:${email}` })
  if (phone) details.push({ label: "Telefon", value: phone, href: `tel:${phone.replace(/\s/g, "")}` })
  if (address) details.push({ label: "Adresă", value: address })

  return (
    <div className="content-container py-8">
      <Breadcrumbs items={[{ label: "Contact" }]} className="mb-6" />

      <div className="max-w-4xl">
        <h1 className="text-2xl-semi mb-2">Contact</h1>
        <p className="text-ui-fg-subtle mb-8 max-w-2xl">{intro}</p>

        <div className="grid grid-cols-1 medium:grid-cols-2 gap-10">
          {/* Detalii firmă */}
          <div className="flex flex-col gap-5">
            {details.length > 0 ? (
              details.map((d) => (
                <div key={d.label}>
                  <p className="txt-small-plus text-ui-fg-base">{d.label}</p>
                  {d.href ? (
                    <a
                      href={d.href}
                      className="text-ui-fg-subtle hover:text-ui-fg-base transition-colors"
                    >
                      {d.value}
                    </a>
                  ) : (
                    <p className="text-ui-fg-subtle whitespace-pre-line">
                      {d.value}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-ui-fg-muted text-sm">
                Datele de contact vor fi adăugate în curând.
              </p>
            )}

            <div className="text-ui-fg-muted text-xs mt-2">
              {company}
              {s.company_cui ? ` · CUI ${s.company_cui}` : ""}
              {s.company_reg ? ` · ${s.company_reg}` : ""}
            </div>
          </div>

          {/* Formular */}
          <div>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  )
}
