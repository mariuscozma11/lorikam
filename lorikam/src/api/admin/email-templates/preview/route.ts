import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { renderEmail } from "../../../../modules/resend-notification/emails/templates"
import { loadEmailOverrides } from "../../../../modules/resend-notification/emails/load-overrides"

// Sample payloads so the client can see the real email without placing an
// order. Shapes mirror what the subscriber/workflow actually pass.
const SAMPLES: Record<string, any> = {
  "order-placed": {
    order: {
      display_id: 1042,
      currency_code: "ron",
      total: 265,
      tax_total: 46.03,
      shipping_total: 25,
      customer: { first_name: "Ionuț", last_name: "Popescu" },
      items: [
        {
          product_title: "Tricou SCM Poli",
          variant_title: "Copil / 12 ani / Negru",
          quantity: 2,
          unit_price: 120,
        },
      ],
      shipping_address: {
        first_name: "Ionuț",
        last_name: "Popescu",
        address_1: "Strada Martirilor 18",
        city: "Timișoara",
        province: "Timiș",
        postal_code: "300123",
        country_code: "ro",
        phone: "+40 722 000 000",
      },
    },
  },
  "contact-message": {
    contact: {
      name: "Maria Ionescu",
      email: "maria@example.ro",
      phone: "+40 733 111 222",
      message: "Bună ziua,\nAș dori o ofertă pentru 20 de tricouri.",
    },
  },
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const template = (req.query.template as string) || "order-placed"
  const sample = SAMPLES[template]

  if (!sample) {
    res.status(404).json({ message: `Șablon necunoscut: ${template}` })
    return
  }

  // Preview unsaved edits by passing them as ?overrides=<json>, otherwise show
  // what would actually go out right now.
  let overrides = await loadEmailOverrides(req.scope)

  if (typeof req.query.overrides === "string") {
    try {
      overrides = { ...overrides, ...JSON.parse(req.query.overrides) }
    } catch {
      res.status(400).json({ message: "Parametrul `overrides` nu e JSON valid." })
      return
    }
  }

  const { subject, html } = renderEmail(template, { ...sample, overrides })

  res.json({ template, subject, html })
}
