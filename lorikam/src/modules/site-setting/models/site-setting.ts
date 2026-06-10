import { model } from "@medusajs/framework/utils"

// Generic key/value store for site-wide settings (marketing images, OG image,
// logo, etc.). Values are typically image URLs but can hold any string.
const SiteSetting = model.define("site_setting", {
  id: model.id().primaryKey(),
  key: model.text().unique(),
  value: model.text().nullable(),
})

export default SiteSetting
