import { model } from "@medusajs/framework/utils"

const CustomerDiscount = model.define("customer_discount", {
  id: model.id().primaryKey(),
  customer_id: model.text().unique(),
  discount_percentage: model.bigNumber().default(0),
  is_active: model.boolean().default(true),
  notes: model.text().nullable(),
})

export default CustomerDiscount
