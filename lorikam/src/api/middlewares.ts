import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import multer from "multer"
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
import { UpdateProductInventorySchema } from "./admin/products/[id]/inventory/validators"
import { teamMiddlewares } from "./admin/teams/middlewares"
import {
  CreateSizePresetSchema,
  UpdateSizePresetSchema,
} from "./admin/size-presets/validators"
import {
  CreateCroiSchema,
  UpdateCroiSchema,
} from "./admin/crois/validators"
import { BuildVariantsSchema } from "./admin/products/[id]/build-variants/validators"
import { FullCreateProductSchema } from "./admin/products/full-create/validators"
import {
  CreateContentPageSchema,
  UpdateContentPageSchema,
} from "./admin/content-pages/validators"

export const GetColorsSchema = createFindParams()

const uploadMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
})

export default defineMiddlewares({
  routes: [
    ...teamMiddlewares,
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
    {
      matcher: "/admin/products/:id/inventory",
      method: "POST",
      middlewares: [validateAndTransformBody(UpdateProductInventorySchema)],
    },
    {
      matcher: "/admin/size-presets",
      method: "POST",
      middlewares: [validateAndTransformBody(CreateSizePresetSchema)],
    },
    {
      matcher: "/admin/size-presets/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(UpdateSizePresetSchema)],
    },
    {
      matcher: "/admin/crois",
      method: "POST",
      middlewares: [validateAndTransformBody(CreateCroiSchema)],
    },
    {
      matcher: "/admin/crois/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(UpdateCroiSchema)],
    },
    {
      matcher: "/admin/products/:id/build-variants",
      method: "POST",
      middlewares: [validateAndTransformBody(BuildVariantsSchema)],
    },
    {
      matcher: "/admin/products/full-create",
      method: "POST",
      middlewares: [validateAndTransformBody(FullCreateProductSchema)],
    },
    {
      matcher: "/admin/uploads",
      method: "POST",
      // @ts-ignore - multer middleware
      middlewares: [uploadMulter.array("files")],
    },
    {
      matcher: "/admin/content-pages",
      method: "POST",
      middlewares: [validateAndTransformBody(CreateContentPageSchema)],
    },
    {
      matcher: "/admin/content-pages/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(UpdateContentPageSchema)],
    },
  ],
})
