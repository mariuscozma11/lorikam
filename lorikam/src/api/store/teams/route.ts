import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// GET /store/teams - List all active teams (for storefront)
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")

  const { data: teams } = await query.graph({
    entity: "team",
    fields: ["id", "name", "handle", "logo", "primary_color", "secondary_color", "description", "banner_image"],
    filters: {
      is_active: true,
    },
  })

  return res.json({ teams })
}
