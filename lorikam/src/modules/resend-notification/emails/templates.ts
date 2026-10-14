// Email templates rendered as plain HTML strings (no extra render deps).
// Each template maps notification `template` id -> { subject, html }.

const BRAND = "Lorikam"

/**
 * Coerces whatever Medusa hands us for a money field into a number.
 *
 * This is not defensive programming for its own sake. Order totals are
 * COMPUTED fields: the REST layer serialises them as plain numbers, but
 * `query.graph` inside a subscriber returns Medusa's BigNumber objects. The
 * previous implementation was `typeof amount === "number" ? amount : 0`, so
 * every BigNumber silently became zero — and because it was silent, the order
 * confirmation went out to customers reading "Total: 0.00 RON" while the line
 * items above it showed the real prices. Verified on order #4: total 254 RON,
 * email said 0.00.
 *
 * Falling back to 0 on something genuinely unparseable is still wrong, but at
 * that point there is nothing better to print and the line items carry the
 * real figures.
 */
function toAmount(amount: unknown): number {
  if (typeof amount === "number") return Number.isFinite(amount) ? amount : 0
  if (typeof amount === "string") {
    const parsed = Number(amount)
    return Number.isFinite(parsed) ? parsed : 0
  }
  if (amount && typeof amount === "object") {
    // BigNumber exposes the value under `numeric`; some serialisations carry
    // it as a `value` string instead.
    const candidate = (amount as { numeric?: unknown; value?: unknown })
    for (const raw of [candidate.numeric, candidate.value]) {
      if (raw !== undefined && raw !== null) {
        const parsed = Number(raw)
        if (Number.isFinite(parsed)) return parsed
      }
    }
    // Last resort: BigNumber defines toString/valueOf.
    const parsed = Number(amount)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

function formatPrice(amount: unknown, currency: string): string {
  return `${toAmount(amount).toFixed(2)} ${(currency || "RON").toUpperCase()}`
}

// Visitor-supplied text (the contact form) ends up both inside element bodies
// and inside attributes like href="mailto:…", so it has to be escaped before it
// is interpolated. `&` is replaced first, otherwise the entities produced by the
// later replacements would get double-escaped.
function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

// Outgoing mail is send-only (no inbox behind the Resend sender), so every
// email has to point people somewhere they'll actually be read.
export const DEFAULT_CONTACT_EMAIL = "contact@lorikam.com"

function layout(title: string, body: string, contactEmail?: string): string {
  const contact = contactEmail || DEFAULT_CONTACT_EMAIL
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
                Acesta este un email automat — te rugăm să nu răspunzi.
                Pentru orice întrebare scrie-ne la
                <a href="mailto:${contact}" style="color:#71717a;">${contact}</a>.
                <br/><br/>
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

// Copy blocks the client can edit from admin (Emailuri). The structural parts
// — item table, totals, address — stay in code so a bad edit can't produce a
// broken order email.
export const EDITABLE_FIELDS = {
  "order-placed": {
    subject: "Confirmare comandă #{{display_id}} — Lorikam",
    heading: "Mulțumim pentru comandă, {{customer_name}}!",
    intro:
      "Am primit comanda ta <strong>#{{display_id}}</strong> și o pregătim. Îți trimitem un email când este expediată.",
    outro: "",
  },
  "order-shipped": {
    subject: "Comanda #{{display_id}} a fost expediată — Lorikam",
    heading: "Comanda ta e pe drum, {{customer_name}}!",
    intro:
      "Am predat comanda <strong>#{{display_id}}</strong> curierului. Vei primi coletul în 1-3 zile lucrătoare.",
    outro: "",
  },
  "order-delivered": {
    subject: "Comanda #{{display_id}} a fost livrată — Lorikam",
    heading: "Comanda ta a ajuns, {{customer_name}}!",
    intro:
      "Comanda <strong>#{{display_id}}</strong> a fost livrată. Sperăm să îți placă!",
    outro: "Dacă e ceva în neregulă, scrie-ne la {{contact_email}} în 14 zile.",
  },
  "order-canceled": {
    subject: "Comanda #{{display_id}} a fost anulată — Lorikam",
    heading: "Comanda #{{display_id}} a fost anulată",
    intro:
      "Comanda ta a fost anulată. Dacă ai plătit online, banii se întorc pe același card în 5-10 zile lucrătoare.",
    outro: "Dacă nu tu ai cerut anularea, scrie-ne la {{contact_email}}.",
  },
  "customer-welcome": {
    subject: "Bine ai venit la Lorikam!",
    heading: "Bine ai venit, {{customer_name}}!",
    intro:
      "Contul tău a fost creat. De acum poți urmări comenzile și salva adresele de livrare.",
    outro: "",
  },
  "contact-message": {
    subject: "Mesaj contact de la {{name}}",
    heading: "Mesaj nou de contact",
    intro: "",
    outro: "",
  },
  // No {{customer_name}} anywhere in this one on purpose: the password reset
  // event carries only an identifier, and for an admin user there is no
  // customer record at all — a greeting would come out as "Salut ,".
  "password-reset": {
    subject: "Resetare parolă — Lorikam",
    heading: "Resetează-ți parola",
    intro:
      "Am primit o cerere de resetare a parolei pentru contul asociat adresei <strong>{{email}}</strong>. Apasă butonul de mai jos ca să îți alegi o parolă nouă.",
    outro:
      "Dacă nu ai cerut tu resetarea, ignoră acest email — parola rămâne neschimbată. Pentru orice nelămurire scrie-ne la {{contact_email}}.",
  },
  // Internal email, so the copy is deliberately terse: it is read on a phone
  // between orders, not browsed. The subject carries everything needed to
  // triage without opening the message.
  "order-placed-merchant": {
    subject: "Comandă nouă #{{display_id}} — {{order_total}}",
    heading: "Comandă nouă #{{display_id}}",
    intro: "",
    outro: "",
  },
} as const

export type EmailOverrides = Record<string, string | null | undefined>

// Settings key for a template field, e.g. email_order_placed_subject.
export function overrideKey(template: string, field: string) {
  return `email_${template.replace(/-/g, "_")}_${field}`
}

function applyVars(text: string, vars: Record<string, string | number>) {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name) =>
    String(vars[name] ?? "")
  )
}

// Falls back to the built-in copy when the client hasn't overridden it. An
// override saved as an empty string is treated as "use the default" for
// subject/heading, but as a real empty for the optional outro block.
function contactAddress(overrides: EmailOverrides | undefined) {
  const configured = (overrides?.["company_email"] || "").trim()
  return configured || DEFAULT_CONTACT_EMAIL
}

/**
 * Where internal (merchant-facing) mail goes.
 *
 * Same settings and same precedence idea as the provider's reply-to in
 * `service.ts`, only the other way round: that one asks "where should a
 * customer's Reply land", this one asks "which inbox does the shop actually
 * read". `company_email` is the address the client typed into Setări site →
 * Email contact and is already where the contact form delivers, so order
 * alerts land in the same place instead of a second, forgotten inbox.
 * `email_reply_to` is the next best guess, because it is by definition an
 * address a human monitors. The constant is last and only exists so an
 * unconfigured store still mails somebody rather than dropping the alert.
 */
export function merchantRecipient(
  overrides: EmailOverrides | undefined
): string {
  const pick = (key: string) => (overrides?.[key] || "").trim()
  return (
    pick("company_email") || pick("email_reply_to") || DEFAULT_CONTACT_EMAIL
  )
}

function copy(
  template: keyof typeof EDITABLE_FIELDS,
  field: "subject" | "heading" | "intro" | "outro",
  overrides: EmailOverrides | undefined,
  vars: Record<string, string | number>
) {
  const stored = overrides?.[overrideKey(template, field)]
  const fallback = EDITABLE_FIELDS[template][field] as string
  const value =
    field === "outro" ? stored ?? fallback : (stored || "").trim() || fallback

  return applyVars(value ?? "", vars)
}

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
      // Coerced the same way as the totals: unit_price is a plain number over
      // REST but a BigNumber through query.graph, and `unit * qty` on a
      // BigNumber yields NaN, which would print as 0.00.
      const unit = toAmount(item.unit_price)
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

  const overrides: EmailOverrides | undefined = data?.overrides
  const contactEmail = contactAddress(overrides)
  const vars = {
    display_id: displayId,
    customer_name: customerName,
    contact_email: contactEmail,
  }

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;">${copy("order-placed", "heading", overrides, vars)}</h1>
    <p style="margin:0 0 24px;color:#52525b;font-size:15px;">
      ${copy("order-placed", "intro", overrides, vars)}
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
        // Regions and currencies are configured tax-inclusive, so the line
        // items and shipping above already contain the VAT. Labelled plainly
        // "TVA" this row reads as an extra charge and the column stops adding
        // up to Total; "din care TVA" says it is a breakdown, not an addition.
        order.tax_total != null
          ? `<tr><td style="padding:2px 0;color:#52525b;">din care TVA</td><td style="padding:2px 0;text-align:right;">${formatPrice(order.tax_total, currency)}</td></tr>`
          : ""
      }
      <tr>
        <td style="padding:8px 0 0;font-size:18px;font-weight:700;border-top:1px solid #e4e4e7;">Total</td>
        <td style="padding:8px 0 0;font-size:18px;font-weight:700;text-align:right;border-top:1px solid #e4e4e7;">${formatPrice(order.total ?? 0, currency)}</td>
      </tr>
    </table>
    ${addressBlock}
    ${
      copy("order-placed", "outro", overrides, vars)
        ? `<p style="margin:24px 0 0;color:#52525b;font-size:15px;line-height:1.6;">${copy("order-placed", "outro", overrides, vars)}</p>`
        : ""
    }
  `

  return {
    subject: copy("order-placed", "subject", overrides, vars),
    html: layout(`Confirmare comandă #${displayId}`, body, contactEmail),
  }
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
  const overrides: EmailOverrides | undefined = data?.overrides
  const vars = { name: c.name || "vizitator", email: c.email || "" }
  const body = `
    <h1 style="margin:0 0 16px;font-size:20px;">${copy("contact-message", "heading", overrides, vars)}</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;">
      <tr><td style="padding:4px 0;color:#71717a;width:90px;">Nume</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(c.name || "")}</td></tr>
      <tr><td style="padding:4px 0;color:#71717a;">Email</td><td style="padding:4px 0;"><a href="mailto:${escapeHtml(c.email || "")}">${escapeHtml(c.email || "")}</a></td></tr>
      ${c.phone ? `<tr><td style="padding:4px 0;color:#71717a;">Telefon</td><td style="padding:4px 0;">${escapeHtml(c.phone)}</td></tr>` : ""}
    </table>
    <p style="margin:20px 0 6px;font-weight:600;">Mesaj</p>
    <p style="margin:0;color:#52525b;font-size:15px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(c.message || "")}</p>
  `
  return {
    subject: copy("contact-message", "subject", overrides, vars),
    html: layout("Mesaj de contact", body),
  }
}

// Status emails share one shape: a headline, a paragraph, and a short recap
// of the order. Only the copy differs, and that copy is client-editable.
function orderStatusEmail(
  template: "order-shipped" | "order-delivered" | "order-canceled",
  data: any
): EmailContent {
  const order = data?.order ?? data ?? {}
  const overrides: EmailOverrides | undefined = data?.overrides
  const displayId = order.display_id ?? order.id ?? ""
  const customerName =
    order.shipping_address?.first_name || order.customer?.first_name || "client"
  const contactEmail = contactAddress(overrides)
  const vars = {
    display_id: displayId,
    customer_name: customerName,
    contact_email: contactEmail,
  }

  const items: any[] = Array.isArray(order.items) ? order.items : []
  const itemLines = items
    .map((item) => {
      const title = item.product_title || item.title || "Produs"
      const variant = item.variant_title || item.subtitle || ""
      const qty = item.quantity ?? 1
      return `<tr>
        <td style="padding:6px 0;border-bottom:1px solid #f0f0f0;">
          <div style="font-weight:600;">${title}</div>
          ${variant ? `<div style="color:#71717a;font-size:13px;">${variant}</div>` : ""}
        </td>
        <td style="padding:6px 0;border-bottom:1px solid #f0f0f0;text-align:right;color:#52525b;">×${qty}</td>
      </tr>`
    })
    .join("")

  const tracking: string[] = Array.isArray(data?.tracking_numbers)
    ? data.tracking_numbers.filter(Boolean)
    : []

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;">${copy(template, "heading", overrides, vars)}</h1>
    <p style="margin:0 0 24px;color:#52525b;font-size:15px;">
      ${copy(template, "intro", overrides, vars)}
    </p>
    ${
      tracking.length
        ? `<p style="margin:0 0 24px;font-size:15px;">Număr AWB: <strong>${tracking.join(", ")}</strong></p>`
        : ""
    }
    ${
      itemLines
        ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">${itemLines}</table>`
        : ""
    }
    ${
      copy(template, "outro", overrides, vars)
        ? `<p style="margin:24px 0 0;color:#52525b;font-size:15px;line-height:1.6;">${copy(template, "outro", overrides, vars)}</p>`
        : ""
    }
  `

  return {
    subject: copy(template, "subject", overrides, vars),
    html: layout(`Comanda #${displayId}`, body, contactEmail),
  }
}

function customerWelcome(data: any): EmailContent {
  const customer = data?.customer ?? data ?? {}
  const overrides: EmailOverrides | undefined = data?.overrides
  const contactEmail = contactAddress(overrides)
  const vars = {
    customer_name: customer.first_name || "prieten",
    email: customer.email || "",
    contact_email: contactEmail,
  }

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;">${copy("customer-welcome", "heading", overrides, vars)}</h1>
    <p style="margin:0 0 24px;color:#52525b;font-size:15px;">
      ${copy("customer-welcome", "intro", overrides, vars)}
    </p>
    ${
      copy("customer-welcome", "outro", overrides, vars)
        ? `<p style="margin:0;color:#52525b;font-size:15px;line-height:1.6;">${copy("customer-welcome", "outro", overrides, vars)}</p>`
        : ""
    }
  `

  return {
    subject: copy("customer-welcome", "subject", overrides, vars),
    html: layout("Bine ai venit", body, contactEmail),
  }
}

function passwordReset(data: any): EmailContent {
  const overrides: EmailOverrides | undefined = data?.overrides
  const contactEmail = contactAddress(overrides)
  // The subscriber builds the URL, because only it knows whether this is a
  // customer (storefront) or an admin user (admin panel).
  const resetUrl = String(data?.reset_url ?? "")
  const isAdmin = data?.actor_type === "user"

  // Two var sets, because `copy()` feeds both an HTML body and a plain-text
  // subject. Escaping once up front would put a literal "&#39;" in the inbox
  // subject line; not escaping at all would put customer-supplied text
  // straight into the markup. So: raw for the subject, escaped for the body.
  const textVars = {
    email: String(data?.email ?? ""),
    contact_email: contactEmail,
  }
  const vars = {
    email: escapeHtml(textVars.email),
    contact_email: contactEmail,
  }

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;">${copy("password-reset", "heading", overrides, vars)}</h1>
    <p style="margin:0 0 24px;color:#52525b;font-size:15px;line-height:1.6;">
      ${copy("password-reset", "intro", overrides, vars)}
    </p>
    ${
      isAdmin
        ? `<p style="margin:0 0 24px;color:#52525b;font-size:15px;">Linkul duce către panoul de administrare, nu către magazin.</p>`
        : ""
    }
    <p style="margin:0 0 24px;">
      <a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 28px;border-radius:8px;">Setează o parolă nouă</a>
    </p>
    <p style="margin:0 0 24px;color:#71717a;font-size:13px;line-height:1.6;">
      Dacă butonul nu funcționează, copiază linkul acesta în browser:<br/>
      <span style="word-break:break-all;color:#52525b;">${escapeHtml(resetUrl)}</span>
    </p>
    <p style="margin:0 0 24px;color:#52525b;font-size:15px;">
      Linkul poate fi folosit o singură dată și expiră după un timp scurt. Dacă a expirat, cere o resetare nouă.
    </p>
    ${
      copy("password-reset", "outro", overrides, vars)
        ? `<p style="margin:24px 0 0;color:#52525b;font-size:15px;line-height:1.6;">${copy("password-reset", "outro", overrides, vars)}</p>`
        : ""
    }
  `

  return {
    subject: copy("password-reset", "subject", overrides, textVars),
    html: layout("Resetare parolă", body, contactEmail),
  }
}

// The shop's own copy of an incoming order. Everything in here is operational:
// who ordered, what to produce (personalisations included), how it ships and
// where to. Without it a new order is invisible until somebody happens to open
// the admin, which for a store this size means orders sitting unnoticed.
//
// Every interpolated value is escaped. Unlike the customer confirmation, this
// email contains fields a stranger typed — the personalisation inputs, the
// address, the name — and they reach the one inbox the shop definitely opens.
function orderPlacedMerchant(data: any): EmailContent {
  const order = data?.order ?? data ?? {}
  const overrides: EmailOverrides | undefined = data?.overrides
  const currency = order.currency_code || "ron"
  const displayId = order.display_id ?? order.id ?? ""
  const addr = order.shipping_address ?? {}
  const customerName =
    [addr.first_name, addr.last_name].filter(Boolean).join(" ") ||
    [order.customer?.first_name, order.customer?.last_name]
      .filter(Boolean)
      .join(" ") ||
    "—"

  // Raw for the subject line, escaped for the body — see passwordReset() for
  // why the two cannot be the same object.
  const textVars = {
    display_id: displayId,
    customer_name: customerName,
    order_total: formatPrice(order.total ?? 0, currency),
  }
  const vars = {
    ...textVars,
    customer_name: escapeHtml(customerName),
  }

  // Same rule the storefront uses (see lib/util/customization-label.ts): the
  // line item stores the original labels next to the slugged keys, because
  // prettifying "numar_tricou" loses the diacritics in "Număr tricou".
  const customizationLabel = (
    key: string,
    labels: Record<string, string> | undefined
  ) =>
    labels?.[key] ||
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  const items: any[] = Array.isArray(order.items) ? order.items : []
  const itemRows = items
    .map((item) => {
      const title = item.product_title || item.title || "Produs"
      const variant = item.variant_title || item.subtitle || ""
      const qty = item.quantity ?? 1
      // Coerced the same way as the totals: unit_price is a plain number over
      // REST but a BigNumber through query.graph, and `unit * qty` on a
      // BigNumber yields NaN, which would print as 0.00.
      const unit = toAmount(item.unit_price)
      const customizations = (item.metadata?.customizations ?? {}) as Record<
        string,
        string
      >
      const labels = item.metadata?.customization_labels as
        | Record<string, string>
        | undefined
      // Highlighted rather than listed with the variant: this is the part that
      // gets printed or embroidered, and getting it wrong means redoing the
      // product, so it has to be impossible to skim past.
      const personalisation = Object.entries(customizations)
        .filter(([, value]) => value !== null && value !== undefined && value !== "")
        .map(
          ([key, value]) =>
            `<div style="font-size:13px;color:#18181b;"><span style="color:#71717a;">${escapeHtml(customizationLabel(key, labels))}:</span> <strong>${escapeHtml(value)}</strong></div>`
        )
        .join("")

      return `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
          <div style="font-weight:600;">${escapeHtml(title)}</div>
          ${variant ? `<div style="color:#71717a;font-size:13px;">${escapeHtml(variant)}</div>` : ""}
          ${personalisation ? `<div style="margin-top:6px;padding:8px 10px;background:#fafafa;border-left:3px solid #18181b;">${personalisation}</div>` : ""}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:center;color:#52525b;vertical-align:top;">${escapeHtml(qty)}</td>
        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:right;vertical-align:top;">${formatPrice(unit * qty, currency)}</td>
      </tr>`
    })
    .join("")

  const shippingMethods: any[] = Array.isArray(order.shipping_methods)
    ? order.shipping_methods
    : []
  const shippingLine =
    shippingMethods
      .map((m) =>
        [
          escapeHtml(m?.name || "Livrare"),
          m?.amount != null ? `(${formatPrice(m.amount, currency)})` : "",
        ]
          .filter(Boolean)
          .join(" ")
      )
      .join(", ") || "—"

  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 0;color:#71717a;width:140px;vertical-align:top;">${label}</td><td style="padding:4px 0;">${value}</td></tr>`

  const phone = addr.phone || order.customer?.phone || ""
  const addressLines = [
    [addr.address_1, addr.address_2].filter(Boolean).join(", "),
    [addr.postal_code, addr.city].filter(Boolean).join(" "),
    addr.province || "",
    addr.country_code ? String(addr.country_code).toUpperCase() : "",
  ]
    .filter(Boolean)
    .map((line) => escapeHtml(line))
    .join("<br/>")

  const body = `
    <h1 style="margin:0 0 16px;font-size:20px;">${copy("order-placed-merchant", "heading", overrides, vars)}</h1>
    ${
      copy("order-placed-merchant", "intro", overrides, vars)
        ? `<p style="margin:0 0 20px;color:#52525b;font-size:15px;">${copy("order-placed-merchant", "intro", overrides, vars)}</p>`
        : ""
    }
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;margin-bottom:24px;">
      ${row("Client", escapeHtml(customerName))}
      ${row(
        "Email",
        order.email
          ? `<a href="mailto:${escapeHtml(order.email)}" style="color:#18181b;">${escapeHtml(order.email)}</a>`
          : "—"
      )}
      ${row(
        "Telefon",
        phone
          ? `<a href="tel:${escapeHtml(String(phone).replace(/[^\d+]/g, ""))}" style="color:#18181b;">${escapeHtml(phone)}</a>`
          : "—"
      )}
      ${row("Livrare", shippingLine)}
      ${row("Adresă", addressLines || "—")}
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <thead>
        <tr>
          <th align="left" style="padding-bottom:8px;border-bottom:2px solid #18181b;font-size:13px;text-transform:uppercase;color:#71717a;">Produs</th>
          <th align="center" style="padding-bottom:8px;border-bottom:2px solid #18181b;font-size:13px;text-transform:uppercase;color:#71717a;">Cant.</th>
          <th align="right" style="padding-bottom:8px;border-bottom:2px solid #18181b;font-size:13px;text-transform:uppercase;color:#71717a;">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:8px 0 0;font-size:18px;font-weight:700;border-top:1px solid #e4e4e7;">Total comandă</td>
        <td style="padding:8px 0 0;font-size:18px;font-weight:700;text-align:right;border-top:1px solid #e4e4e7;">${formatPrice(order.total ?? 0, currency)}</td>
      </tr>
    </table>
    ${
      copy("order-placed-merchant", "outro", overrides, vars)
        ? `<p style="margin:24px 0 0;color:#52525b;font-size:15px;line-height:1.6;">${copy("order-placed-merchant", "outro", overrides, vars)}</p>`
        : ""
    }
  `

  return {
    subject: copy("order-placed-merchant", "subject", overrides, textVars),
    // No contact address passed, same as the contact-form email: this one is
    // already going to the shop's own inbox, so pointing it at that inbox in
    // the footer would be circular.
    html: layout(`Comandă nouă #${displayId}`, body),
  }
}

export const TEMPLATES = {
  ORDER_PLACED: "order-placed",
  ORDER_SHIPPED: "order-shipped",
  ORDER_DELIVERED: "order-delivered",
  ORDER_CANCELED: "order-canceled",
  CUSTOMER_WELCOME: "customer-welcome",
  CONTACT: "contact-message",
  PASSWORD_RESET: "password-reset",
  // Second email on order.placed, to the shop rather than the customer.
  ORDER_PLACED_MERCHANT: "order-placed-merchant",
} as const

export function renderEmail(template: string, data: any): EmailContent {
  switch (template) {
    case TEMPLATES.ORDER_PLACED:
      return orderPlaced(data)
    case TEMPLATES.ORDER_SHIPPED:
    case TEMPLATES.ORDER_DELIVERED:
    case TEMPLATES.ORDER_CANCELED:
      return orderStatusEmail(template, data)
    case TEMPLATES.CUSTOMER_WELCOME:
      return customerWelcome(data)
    case TEMPLATES.CONTACT:
      return contactMessage(data)
    case TEMPLATES.PASSWORD_RESET:
      return passwordReset(data)
    case TEMPLATES.ORDER_PLACED_MERCHANT:
      return orderPlacedMerchant(data)
    default:
      return genericFallback(data)
  }
}
