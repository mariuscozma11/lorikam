import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { renderEmail } from "../../../../modules/resend-notification/emails/templates"
import { loadEmailOverrides } from "../../../../modules/resend-notification/emails/load-overrides"
import { SAMPLES } from "../samples"

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
