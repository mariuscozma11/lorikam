import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { TEMPLATES } from "../modules/resend-notification/emails/templates"
import { sendOrderEmail } from "../modules/resend-notification/emails/send-order-email"

export default async function orderCanceledHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  try {
    await sendOrderEmail(container, data.id, TEMPLATES.ORDER_CANCELED)
  } catch (e: any) {
    logger.error(`order.canceled: failed — ${e?.message ?? e}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.canceled",
}
