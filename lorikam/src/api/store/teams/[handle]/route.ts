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

  // products.* comes back whole (metadata included), so unpublished products
  // linked to a team would be public here even though /store/products hides
  // them. Filtered after the fetch because the link join can't be filtered on
  // the product's own columns.
  const team = teams[0]
  const products = (team.products || []).filter(
    (p: any) => p?.status === "published"
  )

  return res.json({ team: { ...team, products } })
}
