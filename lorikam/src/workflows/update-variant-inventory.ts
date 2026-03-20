import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export type VariantInventoryUpdate = {
  variant_id: string
  manage_inventory: boolean
  stocked_quantity?: number
}

export type UpdateVariantInventoryInput = {
  product_id: string
  location_id: string
  updates: VariantInventoryUpdate[]
}

export const updateVariantInventoryStep = createStep(
  "update-variant-inventory-step",
  async (input: UpdateVariantInventoryInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const productService = container.resolve(Modules.PRODUCT)
    const inventoryService = container.resolve(Modules.INVENTORY)
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    const previousStates: {
      variant_id: string
      manage_inventory: boolean
      inventory_item_id?: string
      previous_quantity?: number
    }[] = []

    for (const update of input.updates) {
      // Get variant with current state
      const variant = await productService.retrieveProductVariant(
        update.variant_id,
        { select: ["id", "manage_inventory", "sku", "title"] }
      )

      // Store previous state for rollback
      previousStates.push({
        variant_id: update.variant_id,
        manage_inventory: variant.manage_inventory ?? false,
      })

      // Update manage_inventory on variant
      await productService.updateProductVariants(update.variant_id, {
        manage_inventory: update.manage_inventory,
      })

      if (update.manage_inventory) {
        // Check if variant already has an inventory item linked
        const { data: variantWithInventory } = await query.graph({
          entity: "product_variant",
          filters: { id: update.variant_id },
          fields: ["id", "inventory_items.inventory_item_id"],
        })

        const existingInventoryItems =
          (variantWithInventory[0] as any)?.inventory_items || []
        let inventoryItemId: string

        if (existingInventoryItems.length > 0) {
          // Use existing inventory item
          inventoryItemId = existingInventoryItems[0].inventory_item_id
        } else {
          // Create new inventory item
          const inventoryItem = await inventoryService.createInventoryItems({
            sku: variant.sku || `${variant.id}-sku`,
            title: variant.title,
          })

          inventoryItemId = inventoryItem.id

          // Link to variant using the link module
          await link.create({
            [Modules.PRODUCT]: { variant_id: update.variant_id },
            [Modules.INVENTORY]: { inventory_item_id: inventoryItemId },
          })
        }

        // Update previous state with inventory item id
        previousStates[previousStates.length - 1].inventory_item_id =
          inventoryItemId

        // Set stock quantity at location if provided
        if (
          update.stocked_quantity !== undefined &&
          update.stocked_quantity >= 0
        ) {
          // Check if inventory level exists at this location
          const levels = await inventoryService.listInventoryLevels({
            inventory_item_id: inventoryItemId,
            location_id: input.location_id,
          })

          if (levels.length > 0) {
            // Store previous quantity for rollback
            previousStates[previousStates.length - 1].previous_quantity =
              levels[0].stocked_quantity

            // Update existing level - requires inventory_item_id and location_id
            await inventoryService.updateInventoryLevels({
              inventory_item_id: inventoryItemId,
              location_id: input.location_id,
              stocked_quantity: update.stocked_quantity,
            })
          } else {
            // Create new level at location
            await inventoryService.createInventoryLevels({
              inventory_item_id: inventoryItemId,
              location_id: input.location_id,
              stocked_quantity: update.stocked_quantity,
            })
          }
        }
      }
    }

    return new StepResponse(
      { success: true, updated_count: input.updates.length },
      {
        product_id: input.product_id,
        location_id: input.location_id,
        previous_states: previousStates,
      }
    )
  },
  async (compensationData, { container }) => {
    if (!compensationData) return

    const productService = container.resolve(Modules.PRODUCT)
    const inventoryService = container.resolve(Modules.INVENTORY)

    // Rollback variant states
    for (const state of compensationData.previous_states) {
      await productService.updateProductVariants(state.variant_id, {
        manage_inventory: state.manage_inventory,
      })

      // Rollback inventory quantity if applicable
      if (
        state.inventory_item_id &&
        state.previous_quantity !== undefined
      ) {
        await inventoryService.updateInventoryLevels({
          inventory_item_id: state.inventory_item_id,
          location_id: compensationData.location_id,
          stocked_quantity: state.previous_quantity,
        })
      }
    }
  }
)

export const updateVariantInventoryWorkflow = createWorkflow(
  "update-variant-inventory",
  function (input: UpdateVariantInventoryInput) {
    const result = updateVariantInventoryStep(input)
    return new WorkflowResponse(result)
  }
)
