import { model } from "@medusajs/framework/utils"

// A reusable, named set of size values (e.g. "Adulți" => [XS, S, M, L, ...]).
const SizePreset = model.define("size_preset", {
  id: model.id().primaryKey(),
  name: model.text(),
  sizes: model.json(), // string[]
  display_order: model.number().default(0),
})

export default SizePreset
