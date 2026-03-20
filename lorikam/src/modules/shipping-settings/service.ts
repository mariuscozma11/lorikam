import { MedusaService } from "@medusajs/framework/utils"
import ShippingSettings from "./models/shipping-settings"

class ShippingSettingsModuleService extends MedusaService({
  ShippingSettings,
}) {}

export default ShippingSettingsModuleService
