import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { createColorWorkflow } from "../../../workflows/create-color"
import { CreateColorSchema, CreateColorType } from "./validators"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")
  const { data: colors, metadata: { count, take, skip } = {} } = await query.graph({
    entity: "color",
    ...req.queryConfig,
  })
  res.json({ colors, count, limit: take, offset: skip })
}

export const POST = async (
  req: MedusaRequest<CreateColorType>,
  res: MedusaResponse
) => {
  const { result } = await createColorWorkflow(req.scope).run({
    input: req.validatedBody,
  })
  res.json({ color: result })
}
