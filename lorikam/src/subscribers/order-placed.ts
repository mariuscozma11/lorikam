import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { TEMPLATES } from "../modules/resend-notification/emails/templates"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")
  const notificationService = container.resolve(Modules.NOTIFICATION)

  try {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "currency_code",
        "total",
        "tax_total",
        "shipping_total",
        "customer.first_name",
        "customer.last_name",
        "items.title",
        "items.subtitle",
        "items.product_title",
        "items.variant_title",
        "items.quantity",
        "items.unit_price",
        "shipping_address.*",
      ],
      filters: { id: data.id },
    })

    const order = orders?.[0]
    if (!order) {
      logger.error(`order.placed: order ${data.id} not found`)
      return
    }
    if (!order.email) {
      logger.warn(`order.placed: order ${data.id} has no email, skipping`)
      return
    }

    await notificationService.createNotifications({
      to: order.email,
      channel: "email",
      template: TEMPLATES.ORDER_PLACED,
      data: { order },
    })

    logger.info(`order.placed: confirmation email queued for ${order.email}`)
  } catch (e: any) {
    logger.error(`order.placed: failed to send confirmation — ${e?.message ?? e}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
