import { model } from "@medusajs/framework/utils"

const ShippingSettings = model.define("shipping_settings", {
  id: model.id().primaryKey(),
  free_shipping_threshold: model.bigNumber().default(0),
  is_free_shipping_enabled: model.boolean().default(false),
})

export default ShippingSettings
