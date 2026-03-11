import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { syncProductColorsWorkflow } from "../../../../../workflows/sync-product-colors"
import { LinkProductColorsType } from "../../../colors/validators"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: [product] } = await query.graph({
    entity: "product",
    filters: { id },
    fields: ["id", "color.*"],
  })

  res.json({ colors: (product as any)?.color || [] })
}

export const POST = async (
  req: MedusaRequest<LinkProductColorsType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const { color_ids } = req.validatedBody

  const { result } = await syncProductColorsWorkflow(req.scope).run({
    input: {
      product_id: id,
      color_ids,
    },
  })

  res.json(result)
}
