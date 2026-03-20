import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { linkProductTeamWorkflow } from "../../../../../workflows/link-product-team"
import { LinkProductSchema } from "../../middlewares"

// POST /admin/teams/:id/products - Link a product to a team
export async function POST(
  req: MedusaRequest<LinkProductSchema>,
  res: MedusaResponse
) {
  const { id: team_id } = req.params
  const { product_id } = req.validatedBody

  await linkProductTeamWorkflow(req.scope).run({
    input: {
      product_id,
      team_id,
    },
  })

  return res.json({ success: true })
}
