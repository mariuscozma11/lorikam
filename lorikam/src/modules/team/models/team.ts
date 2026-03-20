import { model } from "@medusajs/framework/utils"

const Team = model.define("team", {
  id: model.id().primaryKey(),
  name: model.text(),
  handle: model.text().unique(),
  logo: model.text().nullable(),
  primary_color: model.text().nullable(),
  secondary_color: model.text().nullable(),
  description: model.text().nullable(),
  banner_image: model.text().nullable(),
  is_active: model.boolean().default(true),
})

export default Team
