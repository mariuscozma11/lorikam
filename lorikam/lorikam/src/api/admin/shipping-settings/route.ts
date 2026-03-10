import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { SHIPPING_SETTINGS_MODULE } from "../../../modules/shipping-settings"
import ShippingSettingsModuleService from "../../../modules/shipping-settings/service"
import { updateShippingSettingsWorkflow } from "../../../workflows/update-shipping-settings"
import { UpdateShippingSettingsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const shippingSettingsService: ShippingSettingsModuleService =
    req.scope.resolve(SHIPPING_SETTINGS_MODULE)

  const [settings] = await shippingSettingsService.listShippingSettings()

  res.json({
    shipping_settings: settings || {
      free_shipping_threshold: 0,
      is_free_shipping_enabled: false,
    },
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<UpdateShippingSettingsType>,
  res: MedusaResponse
) => {
  const { result } = await updateShippingSettingsWorkflow(req.scope).run({
    input: {
      free_shipping_threshold: req.validatedBody.free_shipping_threshold,
      is_free_shipping_enabled: req.validatedBody.is_free_shipping_enabled,
    },
  })

  res.json({
    shipping_settings: result,
  })
}
