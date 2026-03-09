import {
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework";
import { PostAdminCreateBrand } from "./admin/brands/validators";
import { z } from "@medusajs/framework/zod";

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
  ],
});
