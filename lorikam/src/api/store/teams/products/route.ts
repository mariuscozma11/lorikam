import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// GET /store/teams/products - Get products filtered by team or products without a team
// Query params:
// - team_handle: string (optional) - if provided, returns products for that team
// - no_team: boolean (optional) - if true, returns products without any team link
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")
  const { team_handle, no_team } = req.query as { team_handle?: string; no_team?: string }

  if (team_handle) {
    // Get products linked to a specific team
    const { data: teams } = await query.graph({
      entity: "team",
      fields: ["id", "products.id"],
      filters: {
        handle: team_handle,
        is_active: true,
      },
    })

    if (!teams || teams.length === 0) {
      return res.json({ product_ids: [] })
    }

    const productIds = teams[0].products?.map((p: any) => p.id) || []
    return res.json({ product_ids: productIds })
  }

  if (no_team === "true") {
    // Get all products that don't have a team link
    // First get all products with team links
    const { data: teams } = await query.graph({
      entity: "team",
      fields: ["products.id"],
    })

    const linkedProductIds = new Set<string>()
    teams?.forEach((team: any) => {
      team.products?.forEach((p: any) => {
        linkedProductIds.add(p.id)
      })
    })

    return res.json({
      linked_product_ids: Array.from(linkedProductIds),
      // The storefront will use this to filter out these products
    })
  }

  return res.json({ product_ids: [] })
}
