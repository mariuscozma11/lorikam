import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { TEMPLATES } from "../modules/resend-notification/emails/templates"
import {
  orderFromFulfillment,
  sendOrderEmail,
} from "../modules/resend-notification/emails/send-order-email"

export default async function deliveryCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  try {
    const { orderId } = await orderFromFulfillment(container, data.id)

    if (!orderId) {
      logger.warn(`delivery.created: no order for fulfillment ${data.id}`)
      return
    }

    await sendOrderEmail(container, orderId, TEMPLATES.ORDER_DELIVERED)
  } catch (e: any) {
    logger.error(`delivery.created: failed — ${e?.message ?? e}`)
  }
}

export const config: SubscriberConfig = {
  event: "delivery.created",
}
