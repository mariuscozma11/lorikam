import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { buildProductVariantsWorkflow } from "../../../../../workflows/build-product-variants"
import { BuildVariantsType } from "./validators"

export const POST = async (
  req: MedusaRequest<BuildVariantsType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const { result } = await buildProductVariantsWorkflow(req.scope).run({
    input: {
      product_id: id,
      selections: req.validatedBody.selections,
      price: req.validatedBody.price,
      manage_inventory: req.validatedBody.manage_inventory,
    },
  })
  res.json(result)
}
