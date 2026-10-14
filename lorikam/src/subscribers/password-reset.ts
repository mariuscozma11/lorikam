import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { TEMPLATES } from "../modules/resend-notification/emails/templates"
import { loadEmailOverrides } from "../modules/resend-notification/emails/load-overrides"
import {
  adminUrl,
  storefrontUrl,
} from "../modules/resend-notification/emails/public-urls"
import { isRetryableSendError } from "../modules/resend-notification/emails/send-errors"

/**
 * Medusa generates the reset token and emits this event, but sending the email
 * is entirely the application's job — there is no built-in notification. With
 * no subscriber here, "am uitat parola" returned 200 to the storefront and the
 * customer got nothing at all, which looks like a broken account rather than a
 * missing feature.
 *
 * `entity_id` is the identifier the reset was requested for, which for the
 * emailpass provider is the email address itself — hence no lookup: the event
 * already carries everything the email needs.
 */
export default async function passwordResetHandler({
  event: { data },
  container,
}: SubscriberArgs<{
  entity_id: string
  token: string
  actor_type: string
}>) {
  const logger = container.resolve("logger")
  const notificationService = container.resolve(Modules.NOTIFICATION)

  const { entity_id: email, token, actor_type } = data

  // Both are non-retryable: a second attempt reads the same payload and fails
  // the same way. Logged as errors because either one means a customer asked
  // for a reset and will never receive it.
  if (!email) {
    logger.error("auth.password_reset: event has no entity_id, cannot send")
    return
  }
  if (!token) {
    logger.error(
      `auth.password_reset: no token for ${email}, refusing to send a reset email without one`
    )
    return
  }

  // The token is a JWT and the identifier is an email address; both must
  // survive the query string intact.
  const query = `token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`

  let resetUrl: string

  if (actor_type === "customer") {
    // No country code in the path on purpose. The storefront's routes live
    // under /[countryCode], but its middleware redirects a country-less path
    // to the right region and carries the query string along, so this avoids
    // baking "ro" into backend code.
    resetUrl = `${storefrontUrl("/account/reset-password", logger)}?${query}`
  } else if (actor_type === "user") {
    // An admin user has no storefront account, so the customer-facing link
    // would be a dead end. The dashboard's own reset screen is served by this
    // backend under /app.
    resetUrl = `${adminUrl("/reset-password")}?${query}`
  } else {
    // Third-party or custom actor types (API keys, future actors) have no
    // password screen to send anybody to. Guessing a URL would be worse than
    // not sending, and retrying cannot change the actor type.
    logger.warn(
      `auth.password_reset: unsupported actor_type "${actor_type}" for ${email}, no email sent`
    )
    return
  }

  try {
    await notificationService.createNotifications({
      to: email,
      channel: "email",
      template: TEMPLATES.PASSWORD_RESET,
      data: {
        email,
        actor_type,
        reset_url: resetUrl,
        overrides: await loadEmailOverrides(container),
      },
    })

    logger.info(`auth.password_reset: reset email queued for ${email}`)
  } catch (e: any) {
    const message = e?.message ?? e

    // A password reset is the most time-critical email the store sends — the
    // customer is sitting in front of the login form waiting for it — so a
    // transient Resend failure has to be retried rather than logged and
    // dropped. Rethrowing fails the event-bus job, which is what makes BullMQ
    // try again.
    if (isRetryableSendError(e)) {
      logger.error(
        `auth.password_reset: send failed for ${email}, retrying — ${message}`
      )
      throw e
    }

    // Permanent failure (unverified sender domain, rejected key, bad
    // recipient). Retrying would fail identically until somebody changes the
    // configuration, so swallow it here and leave a log line that names the
    // cause instead of looping.
    logger.error(
      `auth.password_reset: send permanently failed for ${email}, not retrying — ${message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
