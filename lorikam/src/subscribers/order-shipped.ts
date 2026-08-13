import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { TEMPLATES } from "../modules/resend-notification/emails/templates"
import {
  orderFromFulfillment,
  sendOrderEmail,
} from "../modules/resend-notification/emails/send-order-email"

export default async function shipmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; no_notification?: boolean }>) {
  const logger = container.resolve("logger")

  try {
    // Admin can tick "do not notify customer" when creating the shipment.
    if (data.no_notification) {
      return
    }

    const { orderId, trackingNumbers } = await orderFromFulfillment(
      container,
      data.id
    )

    if (!orderId) {
      logger.warn(`shipment.created: no order for fulfillment ${data.id}`)
      return
    }

    await sendOrderEmail(container, orderId, TEMPLATES.ORDER_SHIPPED, {
      tracking_numbers: trackingNumbers,
    })
  } catch (e: any) {
    logger.error(`shipment.created: failed — ${e?.message ?? e}`)
  }
}

export const config: SubscriberConfig = {
  event: "shipment.created",
}
