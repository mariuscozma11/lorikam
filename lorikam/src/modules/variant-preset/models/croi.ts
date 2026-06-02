import { model } from "@medusajs/framework/utils"

// A configurable "croi" (cut/fit), e.g. Copil / Femei / Bărbați.
// Each croi points to a size preset that supplies its default sizes.
const Croi = model.define("croi", {
  id: model.id().primaryKey(),
  label: model.text().unique(),
  size_preset_id: model.text().nullable(),
  display_order: model.number().default(0),
})

export default Croi
