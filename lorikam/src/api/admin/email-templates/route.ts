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
    description: "Trimis clientului imediat după plasarea comenzii.",
    variables: ["display_id", "customer_name"],
  },
  {
    id: "contact-message",
    name: "Mesaj de contact",
    description: "Trimis către adresa firmei când cineva scrie din formular.",
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
