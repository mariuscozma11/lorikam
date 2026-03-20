import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// GET /admin/products/:id/team - Get product's linked team
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const query = req.scope.resolve("query")

  try {
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "team.*"],
      filters: { id },
    })

    const product = products?.[0]
    const team = product?.team || null

    return res.json({ team })
  } catch (error) {
    // If team link doesn't exist or any other error, return null
    return res.json({ team: null })
  }
}
