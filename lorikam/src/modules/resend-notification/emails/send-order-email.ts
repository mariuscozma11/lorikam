import { Modules } from "@medusajs/framework/utils"
import { loadEmailOverrides } from "./load-overrides"

type Container = { resolve: (key: string) => any }

const ORDER_FIELDS = [
  "id",
  "display_id",
  "email",
  "currency_code",
  "total",
  "customer.first_name",
  "customer.last_name",
  "items.title",
  "items.subtitle",
  "items.product_title",
  "items.variant_title",
  "items.quantity",
  "shipping_address.*",
]

export async function sendOrderEmail(
  container: Container,
  orderId: string,
  template: string,
  extra: Record<string, any> = {}
) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")
  const notificationService = container.resolve(Modules.NOTIFICATION)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ORDER_FIELDS,
    filters: { id: orderId },
  })

  const order = orders?.[0]
  if (!order) {
    logger.error(`${template}: order ${orderId} not found`)
    return
  }
  if (!order.email) {
    logger.warn(`${template}: order ${orderId} has no email, skipping`)
    return
  }

  await notificationService.createNotifications({
    to: order.email,
    channel: "email",
    template,
    data: { order, ...extra, overrides: await loadEmailOverrides(container) },
  })

  logger.info(`${template}: email queued for ${order.email}`)
}

// shipment.created and delivery.created carry a fulfillment id, not an order
// id, so the order has to come through the order_fulfillment link.
export async function orderFromFulfillment(
  container: Container,
  fulfillmentId: string
) {
  const query = container.resolve("query")
  const { data } = await query.graph({
    entity: "fulfillment",
    fields: ["id", "order.id", "labels.tracking_number"],
    filters: { id: fulfillmentId },
  })

  const fulfillment = data?.[0] as any

  return {
    orderId: fulfillment?.order?.id as string | undefined,
    trackingNumbers: (fulfillment?.labels ?? [])
      .map((l: any) => l?.tracking_number)
      .filter(Boolean) as string[],
  }
}
