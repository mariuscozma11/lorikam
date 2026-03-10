import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { SHIPPING_SETTINGS_MODULE } from "../../modules/shipping-settings"
import ShippingSettingsModuleService from "../../modules/shipping-settings/service"

type UpdateShippingSettingsInput = {
  free_shipping_threshold: number
  is_free_shipping_enabled: boolean
}

export const updateShippingSettingsStep = createStep(
  "update-shipping-settings-step",
  async (input: UpdateShippingSettingsInput, { container }) => {
    const shippingSettingsService: ShippingSettingsModuleService =
      container.resolve(SHIPPING_SETTINGS_MODULE)

    const [existingSettings] =
      await shippingSettingsService.listShippingSettings()

    let settings
    if (existingSettings) {
      settings = await shippingSettingsService.updateShippingSettings({
        id: existingSettings.id,
        free_shipping_threshold: input.free_shipping_threshold,
        is_free_shipping_enabled: input.is_free_shipping_enabled,
      })
    } else {
      settings = await shippingSettingsService.createShippingSettings({
        free_shipping_threshold: input.free_shipping_threshold,
        is_free_shipping_enabled: input.is_free_shipping_enabled,
      })
    }

    return new StepResponse(settings, existingSettings)
  },
  async (previousSettings, { container }) => {
    if (!previousSettings) return

    const shippingSettingsService: ShippingSettingsModuleService =
      container.resolve(SHIPPING_SETTINGS_MODULE)

    await shippingSettingsService.updateShippingSettings({
      id: previousSettings.id,
      free_shipping_threshold: previousSettings.free_shipping_threshold,
      is_free_shipping_enabled: previousSettings.is_free_shipping_enabled,
    })
  }
)
