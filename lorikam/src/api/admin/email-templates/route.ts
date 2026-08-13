import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { SITE_SETTING_MODULE } from "../../../modules/site-setting"
import SiteSettingModuleService from "../../../modules/site-setting/service"
import { upsertSiteSettingWorkflow } from "../../../workflows/site-setting"
import {
  EDITABLE_FIELDS,
  overrideKey,
} from "../../../modules/resend-notification/emails/templates"
import { UpdateEmailTemplatesType } from "./validators"

const TEMPLATE_META = [
  {
    id: "order-placed",
    name: "Confirmare comandă",
    description:
      "Către client, imediat după plasarea comenzii (eveniment order.placed).",
    variables: ["display_id", "customer_name", "contact_email"],
  },
  {
    id: "order-shipped",
    name: "Comandă expediată",
    description:
      "Către client când marchezi comanda ca expediată în admin (Create shipment). Include AWB-ul dacă l-ai completat.",
    variables: ["display_id", "customer_name", "contact_email"],
  },
  {
    id: "order-delivered",
    name: "Comandă livrată",
    description:
      "Către client când apeși „Mark as delivered” pe livrare în admin.",
    variables: ["display_id", "customer_name", "contact_email"],
  },
  {
    id: "order-canceled",
    name: "Comandă anulată",
    description: "Către client când anulezi comanda din admin.",
    variables: ["display_id", "customer_name", "contact_email"],
  },
  {
    id: "customer-welcome",
    name: "Cont nou (bun venit)",
    description:
      "Către client la crearea unui cont. Nu se trimite pentru comenzile ca vizitator.",
    variables: ["customer_name", "email", "contact_email"],
  },
  {
    id: "contact-message",
    name: "Mesaj de contact (intern)",
    description:
      "Către adresa firmei (Setări site → Email contact) când cineva scrie din formularul de contact.",
    variables: ["name", "email"],
  },
] as const

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const siteSettingService: SiteSettingModuleService =
    req.scope.resolve(SITE_SETTING_MODULE)

  const settings = await siteSettingService.listSiteSettings({})
  const stored = new Map(settings.map((s: any) => [s.key, s.value]))

  res.json({
    templates: TEMPLATE_META.map((meta) => {
      const defaults = EDITABLE_FIELDS[meta.id]

      return {
        ...meta,
        fields: (["subject", "heading", "intro", "outro"] as const).map(
          (field) => {
            const key = overrideKey(meta.id, field)
            return {
              field,
              key,
              value: stored.get(key) ?? "",
              default: defaults[field],
            }
          }
        ),
      }
    }),
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<UpdateEmailTemplatesType>,
  res: MedusaResponse
) => {
  const entries = Object.entries(req.validatedBody.values)

  // Only accept keys we actually generate, so this can't be used to write
  // arbitrary site settings.
  const allowed = new Set(
    TEMPLATE_META.flatMap((meta) =>
      ["subject", "heading", "intro", "outro"].map((f) =>
        overrideKey(meta.id, f)
      )
    )
  )

  const rejected = entries.filter(([key]) => !allowed.has(key)).map(([k]) => k)
  if (rejected.length) {
    res.status(400).json({
      message: `Chei necunoscute: ${rejected.join(", ")}`,
    })
    return
  }

  for (const [key, value] of entries) {
    await upsertSiteSettingWorkflow(req.scope).run({
      input: { key, value },
    })
  }

  res.json({ success: true, updated: entries.length })
}
