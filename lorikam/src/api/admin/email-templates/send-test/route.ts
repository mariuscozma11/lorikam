import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { loadEmailOverrides } from "../../../../modules/resend-notification/emails/load-overrides"
import { SAMPLES } from "../samples"
import { SendTestEmailType } from "../validators"

// Sends a real email through the same path an order uses, so it exercises the
// configured sender, reply-to and template copy — not a simplified stub.
export const POST = async (
  req: AuthenticatedMedusaRequest<SendTestEmailType>,
  res: MedusaResponse
) => {
  const { to, template = "order-placed" } = req.validatedBody
  const sample = SAMPLES[template]

  if (!sample) {
    res.status(404).json({ message: `Șablon necunoscut: ${template}` })
    return
  }

  if (!process.env.RESEND_API_KEY) {
    res.status(400).json({
      message:
        "Resend nu este configurat. Setează RESEND_API_KEY pe server și repornește.",
    })
    return
  }

  const notification = req.scope.resolve(Modules.NOTIFICATION)
  const logger = req.scope.resolve("logger")

  try {
    await notification.createNotifications({
      to,
      channel: "email",
      template,
      data: { ...sample, overrides: await loadEmailOverrides(req.scope) },
    })
  } catch (e: any) {
    // Medusa wraps provider failures, so the useful part is sometimes nested.
    const detail =
      [e?.message, e?.cause?.message, e?.errors?.[0]?.message]
        .map((m) => (typeof m === "string" ? m.trim() : ""))
        .find(Boolean) ?? ""

    // Always log the whole thing: the browser only ever sees `detail`.
    logger.error(`Email de test către ${to} (${template}) a eșuat: ${e?.stack ?? e}`)

    res.status(502).json({
      message: `Trimiterea a eșuat: ${
        detail || "vezi consola serverului pentru detalii."
      }`,
    })
    return
  }

  logger.info(`Email de test trimis către ${to} (${template}).`)

  res.json({ success: true, to, template })
}
