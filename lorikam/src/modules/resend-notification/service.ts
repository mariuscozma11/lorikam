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

    try {
      const { data, error } = await this.client_.emails.send({
        from: this.options_.from,
        to: [notification.to],
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
