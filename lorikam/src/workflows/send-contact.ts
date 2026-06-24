import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { SITE_SETTING_MODULE } from "../modules/site-setting"
import { TEMPLATES } from "../modules/resend-notification/emails/templates"

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
      logger.warn(
        "Contact form: no recipient (set company_email in Setări site or CONTACT_TO env)."
      )
      return new StepResponse({ sent: false })
    }

    await notification.createNotifications({
      to,
      channel: "email",
      template: TEMPLATES.CONTACT,
      data: { contact: input },
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
