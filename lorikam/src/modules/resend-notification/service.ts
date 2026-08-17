import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import { Logger } from "@medusajs/framework/types"
import {
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"
import { Resend } from "resend"
import { renderEmail } from "./emails/templates"

type InjectedDependencies = {
  logger: Logger
}

type ResendOptions = {
  apiKey: string
  from: string
}

const clean = (value: string | null | undefined) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/**
 * Builds `Name <address>` from the stored sender settings. Returns undefined
 * when no address is configured so the caller can fall back to the env value.
 */
export function senderFrom(
  overrides: Record<string, string | null | undefined>
) {
  const address = clean(overrides.email_from_address)

  if (!address) {
    return undefined
  }

  const name = clean(overrides.email_from_name)
  return name ? `${name} <${address}>` : address
}

class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "resend"

  protected logger_: Logger
  protected options_: ResendOptions
  protected client_: Resend

  constructor({ logger }: InjectedDependencies, options: ResendOptions) {
    super()
    this.logger_ = logger
    this.options_ = options
    this.client_ = new Resend(options.apiKey)
  }

  static validateOptions(options: Record<string, unknown>) {
    if (!options.apiKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Resend notification provider requires the `apiKey` option."
      )
    }
    if (!options.from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Resend notification provider requires the `from` option."
      )
    }
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    if (!notification.to) {
      this.logger_.warn("Resend: skipping notification with no recipient")
      return {}
    }

    const { subject, html } = renderEmail(
      notification.template,
      notification.data ?? {}
    )

    // Sender identity is editable from admin (Emailuri → Expeditor) and rides
    // along in `overrides`; the env value is only the fallback.
    const overrides = ((notification.data as any)?.overrides ?? {}) as Record<
      string,
      string | null | undefined
    >
    const from = senderFrom(overrides) ?? this.options_.from
    // Without a reply-to, hitting reply goes to the sending address, which is
    // send-only and drops the message.
    const replyTo =
      clean(overrides.email_reply_to) ?? clean(overrides.company_email)

    try {
      const { data, error } = await this.client_.emails.send({
        from,
        to: [notification.to],
        ...(replyTo ? { replyTo } : {}),
        subject,
        html,
      })

      if (error) {
        this.logger_.error(`Resend send failed: ${error.message}`)
        throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, error.message)
      }

      return { id: data?.id }
    } catch (e: any) {
      this.logger_.error(`Resend send error: ${e?.message ?? e}`)
      throw e
    }
  }
}

export default ResendNotificationProviderService
