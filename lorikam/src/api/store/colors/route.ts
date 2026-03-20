import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: colors } = await query.graph({
    entity: "color",
    fields: ["id", "name", "hex_codes", "display_order"],
  })

  // Sort by display_order
  const sortedColors = colors.sort(
    (a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)
  )

  res.json({ colors: sortedColors })
}
