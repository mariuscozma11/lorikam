import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { SITE_SETTING_MODULE } from "../modules/site-setting"
import { TEMPLATES } from "../modules/resend-notification/emails/templates"
import { loadEmailOverrides } from "../modules/resend-notification/emails/load-overrides"

export type ContactInput = {
  name: string
  email: string
  phone?: string
  message: string
}

const sendContactStep = createStep(
  "send-contact-step",
  async (input: ContactInput, { container }) => {
    const logger = container.resolve("logger")
    const settingService: any = container.resolve(SITE_SETTING_MODULE)
    const notification = container.resolve(Modules.NOTIFICATION)

    const settings = await settingService.listSiteSettings({
      key: "company_email",
    })
    const to = settings?.[0]?.value || process.env.CONTACT_TO

    if (!to) {
      // Failing silently here meant the storefront told the visitor "message
      // sent" while nobody ever received it.
      logger.error(
        "Contact form: no recipient configured (set Email contact in Setări site, or CONTACT_TO env)."
      )
      throw new Error(
        "Formularul de contact nu este configurat. Te rugăm să ne scrii direct pe email."
      )
    }

    await notification.createNotifications({
      to,
      channel: "email",
      template: TEMPLATES.CONTACT,
      data: { contact: input, overrides: await loadEmailOverrides(container) },
    })

    return new StepResponse({ sent: true })
  }
)

export const sendContactMessageWorkflow = createWorkflow(
  "send-contact-message",
  (input: ContactInput) => {
    const result = sendContactStep(input)
    return new WorkflowResponse(result)
  }
)
