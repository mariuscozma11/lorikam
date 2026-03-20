import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

// GET /store/teams/:handle - Get a single team by handle
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { handle } = req.params
  const query = req.scope.resolve("query")

  const { data: teams } = await query.graph({
    entity: "team",
    fields: ["id", "name", "handle", "logo", "primary_color", "secondary_color", "description", "banner_image", "products.*"],
    filters: {
      handle,
      is_active: true,
    },
  })

  if (!teams || teams.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Team not found`)
  }

  return res.json({ team: teams[0] })
}
