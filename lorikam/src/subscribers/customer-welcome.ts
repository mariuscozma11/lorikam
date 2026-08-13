import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { TEMPLATES } from "../modules/resend-notification/emails/templates"
import { loadEmailOverrides } from "../modules/resend-notification/emails/load-overrides"

export default async function customerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  try {
    const query = container.resolve("query")
    const notificationService = container.resolve(Modules.NOTIFICATION)

    const { data: customers } = await query.graph({
      entity: "customer",
      fields: ["id", "email", "first_name", "last_name", "has_account"],
      filters: { id: data.id },
    })

    const customer = customers?.[0]
    if (!customer?.email) {
      return
    }

    // Guests get a customer record at checkout too — only greet real accounts.
    if (!customer.has_account) {
      return
    }

    await notificationService.createNotifications({
      to: customer.email,
      channel: "email",
      template: TEMPLATES.CUSTOMER_WELCOME,
      data: { customer, overrides: await loadEmailOverrides(container) },
    })

    logger.info(`customer.created: welcome email queued for ${customer.email}`)
  } catch (e: any) {
    logger.error(`customer.created: failed — ${e?.message ?? e}`)
  }
}

export const config: SubscriberConfig = {
  event: "customer.created",
}
