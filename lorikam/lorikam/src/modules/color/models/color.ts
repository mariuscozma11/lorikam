import { model } from "@medusajs/framework/utils"

const Color = model.define("color", {
  id: model.id().primaryKey(),
  name: model.text(),
  hex_codes: model.json(),
  display_order: model.number().default(0),
})

export default Color
