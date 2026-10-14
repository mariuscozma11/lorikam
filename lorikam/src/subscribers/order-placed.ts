import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { TEMPLATES } from "../modules/resend-notification/emails/templates"
import { loadEmailOverrides } from "../modules/resend-notification/emails/load-overrides"
import { isRetryableSendError } from "../modules/resend-notification/emails/send-errors"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")
  const notificationService = container.resolve(Modules.NOTIFICATION)

  // Hoisted out of the try so the failure log can name the recipient — the
  // first thing anyone needs when an email did not arrive.
  let recipient: string | undefined

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

    // The order's own totals have to be fetched on their own.
    //
    // query.graph miscomputes a parent's money fields when the same call also
    // asks for a money field on a relation. Measured on order #5 (real total 254
    // RON): asking for `items.unit_price` alongside `total` returns total = 25
    // — the shipping total — and tax_total = 4.34, the VAT on shipping alone.
    // Asking for `shipping_methods.amount` instead returns 259.25. Dropping
    // the nested money field returns the correct 254 / 44.08.
    //
    // This is why the confirmation email told customers their total was 0.00
    // (before formatPrice was fixed) and then 25.00: the number was wrong at
    // the source, not in the rendering.
    const { data: totalsRows } = await query.graph({
      entity: "order",
      fields: ["id", "total", "tax_total", "shipping_total"],
      filters: { id: data.id },
    })

    const order = orders?.[0]
      ? { ...orders[0], ...(totalsRows?.[0] ?? {}) }
      : undefined
    if (!order) {
      logger.error(`order.placed: order ${data.id} not found`)
      return
    }
    if (!order.email) {
      logger.warn(`order.placed: order ${data.id} has no email, skipping`)
      return
    }

    recipient = order.email

    await notificationService.createNotifications({
      to: order.email,
      channel: "email",
      template: TEMPLATES.ORDER_PLACED,
      data: { order, overrides: await loadEmailOverrides(container) },
    })

    logger.info(`order.placed: confirmation email queued for ${order.email}`)
  } catch (e: any) {
    const message = e?.message ?? e

    // Swallowing this used to mean a transient Resend 429 or 500 lost the
    // order confirmation for good: the handler returned normally, so the
    // event-bus job completed and nothing ever ran again. Rethrowing fails
    // the job, which is what lets BullMQ retry it — only worth doing for
    // failures a retry could actually fix.
    if (isRetryableSendError(e)) {
      logger.error(
        `order.placed: failed to send confirmation to ${recipient ?? data.id}, retrying — ${message}`
      )
      throw e
    }

    // Permanent (unverified sender domain, rejected API key, bad address).
    // Every retry would fail the same way, and this runs for every single
    // order, so it stops here with a log line that names the cause.
    logger.error(
      `order.placed: confirmation permanently failed for ${recipient ?? data.id}, not retrying — ${message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
