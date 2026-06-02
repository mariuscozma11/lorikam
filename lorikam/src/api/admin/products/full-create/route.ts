import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createFullProductWorkflow } from "../../../../workflows/create-full-product"
import { FullCreateProductType } from "./validators"

export const POST = async (
  req: MedusaRequest<FullCreateProductType>,
  res: MedusaResponse
) => {
  const { result } = await createFullProductWorkflow(req.scope).run({
    input: req.validatedBody,
  })
  res.status(201).json({ product: result })
}
