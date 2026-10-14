import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import {
  merchantRecipient,
  TEMPLATES,
} from "../modules/resend-notification/emails/templates"
import { loadEmailOverrides } from "../modules/resend-notification/emails/load-overrides"
import { isRetryableSendError } from "../modules/resend-notification/emails/send-errors"

/**
 * Tells the shop a new order arrived.
 *
 * Deliberately a second subscriber on `order.placed` rather than an extra send
 * inside order-placed.ts:
 *
 *  - Each subscriber file is its own event-bus subscriber id, so the two
 *    emails are two independent units of work. If Resend rejects this one, the
 *    customer's confirmation is unaffected and only this job is retried — in
 *    one handler, an unlucky ordering or a thrown error could cost both.
 *  - The customer confirmation is the email that must never regress; it has
 *    been sending real orders since #1. Leaving that file's happy path alone
 *    is worth more than saving one order query.
 *  - They have genuinely different failure policies: a missed internal alert
 *    is an annoyance, a missed customer confirmation is a support ticket.
 *
 * No `no_notification` check, unlike order-shipped.ts: that flag is the admin
 * saying "do not notify the customer", and the shop still needs to know an
 * order came in. (`order.placed` does not carry the flag in any case — only
 * the fulfillment events do.)
 */
export default async function orderPlacedMerchantHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")
  const notificationService = container.resolve(Modules.NOTIFICATION)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "currency_code",
      "total",
      "customer.first_name",
      "customer.last_name",
      "customer.phone",
      "items.title",
      "items.subtitle",
      "items.product_title",
      "items.variant_title",
      "items.quantity",
      "items.unit_price",
      // Personalisation (name, number, …) is stored on the line item's
      // metadata by the storefront. It is the whole reason this email exists:
      // it is what has to be printed, and getting it out of the admin UI and
      // into the shop's inbox is the point.
      "items.metadata",
      // Which courier/option the customer chose — needed before the parcel can
      // be prepared.
      "shipping_methods.name",
      "shipping_methods.amount",
      "shipping_address.*",
    ],
    filters: { id: data.id },
  })

  const order = orders?.[0]
  if (!order) {
    // Nothing to retry against: either the id is wrong or the order is gone.
    logger.error(`order.placed (merchant): order ${data.id} not found`)
    return
  }

  const overrides = await loadEmailOverrides(container)
  // Same settings the Resend provider already reads; see merchantRecipient().
  const to = merchantRecipient(overrides)

  try {
    await notificationService.createNotifications({
      to,
      channel: "email",
      template: TEMPLATES.ORDER_PLACED_MERCHANT,
      data: { order, overrides },
    })

    logger.info(
      `order.placed (merchant): alert for #${order.display_id} queued for ${to}`
    )
  } catch (e: any) {
    const message = e?.message ?? e

    // Worth retrying: an unnoticed order is the exact problem this email was
    // added to solve, so a transient Resend failure must not end here.
    if (isRetryableSendError(e)) {
      logger.error(
        `order.placed (merchant): alert for #${order.display_id} failed, retrying — ${message}`
      )
      throw e
    }

    // Not worth retrying — and specifically must not loop, because the most
    // likely permanent cause is a misconfigured sender or contact address,
    // which would re-fail on every attempt for every order placed.
    logger.error(
      `order.placed (merchant): alert for #${order.display_id} permanently failed (recipient ${to}), not retrying — ${message}`
    )
  }
}

export const config: SubscriberConfig = {
  // Two subscribers on one event is supported and intended here. Medusa
  // derives the subscriber id from this file, so it is automatically distinct
  // from order-placed.ts and the event bus tracks the two independently: a
  // retry of this job does not re-send the customer's confirmation.
  event: "order.placed",
}
