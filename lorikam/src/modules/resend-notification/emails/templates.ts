// Email templates rendered as plain HTML strings (no extra render deps).
// Each template maps notification `template` id -> { subject, html }.

const BRAND = "Lorikam"

function formatPrice(amount: number, currency: string): string {
  const value = typeof amount === "number" ? amount : 0
  return `${value.toFixed(2)} ${(currency || "RON").toUpperCase()}`
}

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="ro">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
            <tr>
              <td style="background:#18181b;padding:24px 32px;">
                <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">${BRAND}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;background:#fafafa;border-top:1px solid #e4e4e7;color:#71717a;font-size:12px;">
                © ${new Date().getFullYear()} ${BRAND}. Toate drepturile rezervate.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

type EmailContent = { subject: string; html: string }

function orderPlaced(data: any): EmailContent {
  const order = data?.order ?? data ?? {}
  const items: any[] = Array.isArray(order.items) ? order.items : []
  const currency = order.currency_code || "ron"
  const displayId = order.display_id ?? order.id ?? ""
  const customerName =
    order.shipping_address?.first_name ||
    order.customer?.first_name ||
    "client"

  const rows = items
    .map((item) => {
      const title = item.product_title || item.title || "Produs"
      const variant = item.variant_title || item.subtitle || ""
      const qty = item.quantity ?? 1
      const unit = item.unit_price ?? 0
      return `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
          <div style="font-weight:600;">${title}</div>
          ${variant ? `<div style="color:#71717a;font-size:13px;">${variant}</div>` : ""}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:center;color:#52525b;">${qty}</td>
        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:right;">${formatPrice(unit * qty, currency)}</td>
      </tr>`
    })
    .join("")

  const addr = order.shipping_address
  const addressBlock = addr
    ? `<p style="margin:0 0 4px;font-weight:600;">Adresă de livrare</p>
       <p style="margin:0;color:#52525b;font-size:14px;line-height:1.5;">
         ${[addr.first_name, addr.last_name].filter(Boolean).join(" ")}<br/>
         ${addr.address_1 || ""}${addr.address_2 ? ", " + addr.address_2 : ""}<br/>
         ${[addr.postal_code, addr.city].filter(Boolean).join(" ")}<br/>
         ${addr.country_code ? addr.country_code.toUpperCase() : ""}
         ${addr.phone ? "<br/>Tel: " + addr.phone : ""}
       </p>`
    : ""

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;">Mulțumim pentru comandă, ${customerName}!</h1>
    <p style="margin:0 0 24px;color:#52525b;font-size:15px;">
      Am primit comanda ta <strong>#${displayId}</strong> și o pregătim. Îți trimitem un email când este expediată.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <thead>
        <tr>
          <th align="left" style="padding-bottom:8px;border-bottom:2px solid #18181b;font-size:13px;text-transform:uppercase;color:#71717a;">Produs</th>
          <th align="center" style="padding-bottom:8px;border-bottom:2px solid #18181b;font-size:13px;text-transform:uppercase;color:#71717a;">Cant.</th>
          <th align="right" style="padding-bottom:8px;border-bottom:2px solid #18181b;font-size:13px;text-transform:uppercase;color:#71717a;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${
        order.shipping_total != null
          ? `<tr><td style="padding:2px 0;color:#52525b;">Livrare</td><td style="padding:2px 0;text-align:right;">${formatPrice(order.shipping_total, currency)}</td></tr>`
          : ""
      }
      ${
        order.tax_total != null
          ? `<tr><td style="padding:2px 0;color:#52525b;">TVA</td><td style="padding:2px 0;text-align:right;">${formatPrice(order.tax_total, currency)}</td></tr>`
          : ""
      }
      <tr>
        <td style="padding:8px 0 0;font-size:18px;font-weight:700;border-top:1px solid #e4e4e7;">Total</td>
        <td style="padding:8px 0 0;font-size:18px;font-weight:700;text-align:right;border-top:1px solid #e4e4e7;">${formatPrice(order.total ?? 0, currency)}</td>
      </tr>
    </table>
    ${addressBlock}
  `

  return { subject: `Confirmare comandă #${displayId} — ${BRAND}`, html: layout(`Confirmare comandă #${displayId}`, body) }
}

function genericFallback(data: any): EmailContent {
  const message = data?.message || "Ai o notificare nouă."
  return {
    subject: data?.subject || `Notificare ${BRAND}`,
    html: layout("Notificare", `<p style="font-size:15px;color:#52525b;">${message}</p>`),
  }
}

function contactMessage(data: any): EmailContent {
  const c = data?.contact ?? data ?? {}
  const body = `
    <h1 style="margin:0 0 16px;font-size:20px;">Mesaj nou de contact</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;">
      <tr><td style="padding:4px 0;color:#71717a;width:90px;">Nume</td><td style="padding:4px 0;font-weight:600;">${c.name || ""}</td></tr>
      <tr><td style="padding:4px 0;color:#71717a;">Email</td><td style="padding:4px 0;"><a href="mailto:${c.email || ""}">${c.email || ""}</a></td></tr>
      ${c.phone ? `<tr><td style="padding:4px 0;color:#71717a;">Telefon</td><td style="padding:4px 0;">${c.phone}</td></tr>` : ""}
    </table>
    <p style="margin:20px 0 6px;font-weight:600;">Mesaj</p>
    <p style="margin:0;color:#52525b;font-size:15px;line-height:1.6;white-space:pre-wrap;">${(c.message || "").replace(/</g, "&lt;")}</p>
  `
  return {
    subject: `Mesaj contact de la ${c.name || "vizitator"}`,
    html: layout("Mesaj de contact", body),
  }
}

export const TEMPLATES = {
  ORDER_PLACED: "order-placed",
  CONTACT: "contact-message",
} as const

export function renderEmail(template: string, data: any): EmailContent {
  switch (template) {
    case TEMPLATES.ORDER_PLACED:
      return orderPlaced(data)
    case TEMPLATES.CONTACT:
      return contactMessage(data)
    default:
      return genericFallback(data)
  }
}
