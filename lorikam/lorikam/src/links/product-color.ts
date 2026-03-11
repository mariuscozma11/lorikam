import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import ColorModule from "../modules/color"

export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    isList: true,
  },
  ColorModule.linkable.color
)
