import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { PostAdminCreateBrand } from "./admin/brands/validators"
import { z } from "@medusajs/framework/zod"
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

export const GetBrandsSchema = createFindParams()
export const GetColorsSchema = createFindParams()

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/brands",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminCreateBrand)],
    },
    {
      matcher: "/admin/products",
      method: ["POST"],
      additionalDataValidator: {
        brand_id: z.string().optional(),
      },
    },
    {
      matcher: "/admin/brands",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetBrandsSchema, {
          defaults: ["id", "name", "products.*"],
          isList: true,
        }),
      ],
    },
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
