import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { updateVariantInventoryWorkflow } from "../../../../../workflows/update-variant-inventory"
import { UpdateProductInventoryType } from "./validators"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
    // Get product variants with inventory data
    const { data: [product] } = await query.graph({
      entity: "product",
      filters: { id },
      fields: [
        "id",
        "variants.id",
        "variants.title",
        "variants.sku",
        "variants.manage_inventory",
        "variants.options.value",
        "variants.inventory_items.inventory_item_id",
        "variants.inventory_items.inventory.id",
        "variants.inventory_items.inventory.sku",
        "variants.inventory_items.inventory.location_levels.*",
      ],
    })

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Get available stock locations
    const stockLocationService = req.scope.resolve(Modules.STOCK_LOCATION)
    const locationsResult = await stockLocationService.listStockLocations({}, {
      select: ["id", "name"],
    })
    // listStockLocations returns array directly
    const locations = Array.isArray(locationsResult) ? locationsResult : []

    // Transform variants data for the widget
    const variants = ((product as any).variants || []).map((variant: any) => {
      const inventoryItem = variant.inventory_items?.[0]?.inventory
      const locationLevels = inventoryItem?.location_levels || []

      // Build a map of location_id -> stocked_quantity
      const stockByLocation: Record<string, number> = {}
      for (const level of locationLevels) {
        stockByLocation[level.location_id] = level.stocked_quantity ?? 0
      }

      return {
        id: variant.id,
        title: variant.title,
        sku: variant.sku,
        options: (variant.options || []).map((o: any) => o.value).join(" / "),
        manage_inventory: variant.manage_inventory ?? false,
        inventory_item_id: inventoryItem?.id || null,
        stock_by_location: stockByLocation,
      }
    })

    res.json({
      variants,
      locations: locations || [],
    })
  } catch (error) {
    res.status(500).json({
      message: "Error fetching inventory data",
      error: (error as Error).message,
    })
  }
}

export const POST = async (
  req: MedusaRequest<UpdateProductInventoryType>,
  res: MedusaResponse
) => {
  const { id } = req.params
  const { location_id, updates } = req.validatedBody

  try {
    const { result } = await updateVariantInventoryWorkflow(req.scope).run({
      input: {
        product_id: id,
        location_id,
        updates,
      },
    })

    res.json(result)
  } catch (error) {
    res.status(500).json({
      message: "Error updating inventory",
      error: (error as Error).message,
    })
  }
}
