import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { unlinkProductTeamWorkflow } from "../../../../../../workflows/link-product-team"

// DELETE /admin/teams/:id/products/:product_id - Unlink a product from a team
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id: team_id, product_id } = req.params

  await unlinkProductTeamWorkflow(req.scope).run({
    input: {
      product_id,
      team_id,
    },
  })

  return res.json({ success: true })
}
