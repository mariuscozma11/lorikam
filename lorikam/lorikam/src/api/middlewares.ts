import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import { UpdateShippingSettingsSchema } from "./admin/shipping-settings/validators"
import {
  CreateCustomerDiscountSchema,
  UpdateCustomerDiscountSchema,
} from "./admin/customer-discounts/validators"
import {
  CreateColorSchema,
  UpdateColorSchema,
  LinkProductColorsSchema,
} from "./admin/colors/validators"

export const GetColorsSchema = createFindParams()

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/shipping-settings",
      method: "POST",
      middlewares: [validateAndTransformBody(UpdateShippingSettingsSchema)],
    },
    {
      matcher: "/admin/customer-discounts",
      method: "POST",
      middlewares: [validateAndTransformBody(CreateCustomerDiscountSchema)],
    },
    {
      matcher: "/admin/customer-discounts/:customer_id",
      method: "PUT",
      middlewares: [validateAndTransformBody(UpdateCustomerDiscountSchema)],
    },
    {
      matcher: "/admin/colors",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetColorsSchema, {
          defaults: ["id", "name", "hex_codes", "display_order"],
          isList: true,
        }),
      ],
    },
    {
      matcher: "/admin/colors",
      method: "POST",
      middlewares: [validateAndTransformBody(CreateColorSchema)],
    },
    {
      matcher: "/admin/colors/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(UpdateColorSchema)],
    },
    {
      matcher: "/admin/products/:id/colors",
      method: "POST",
      middlewares: [validateAndTransformBody(LinkProductColorsSchema)],
    },
  ],
})
