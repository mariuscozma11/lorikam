import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import TeamModule from "../modules/team"

export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    isList: true,
  },
  TeamModule.linkable.team
)
