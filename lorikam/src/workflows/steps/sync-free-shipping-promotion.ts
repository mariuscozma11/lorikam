import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { IPromotionModuleService } from "@medusajs/framework/types"

type SyncFreeShippingPromotionInput = {
  free_shipping_threshold: number
  is_free_shipping_enabled: boolean
}

type StepResult = {
  action: "created" | "updated" | "deleted" | "none"
  promotionId?: string
}

const FREE_SHIPPING_PROMO_CODE = "FREE_SHIPPING_AUTO"

export const syncFreeShippingPromotionStep = createStep(
  "sync-free-shipping-promotion-step",
  async (
    input: SyncFreeShippingPromotionInput,
    { container }
  ): Promise<StepResponse<StepResult, string | null>> => {
    const promotionService: IPromotionModuleService =
      container.resolve(Modules.PROMOTION)

    // Find existing auto free shipping promotion
    const existingPromos = await promotionService.listPromotions({
      code: FREE_SHIPPING_PROMO_CODE,
    })
    const existingPromo = existingPromos[0]

    // If free shipping is disabled, delete existing promo if it exists
    if (!input.is_free_shipping_enabled) {
      if (existingPromo) {
        await promotionService.deletePromotions([existingPromo.id])
        return new StepResponse(
          { action: "deleted", promotionId: existingPromo.id },
          existingPromo.id
        )
      }
      return new StepResponse({ action: "none" }, null)
    }

    // Free shipping is enabled - create or update promotion
    if (existingPromo) {
      // Delete and recreate to update rules (simpler than complex update)
      await promotionService.deletePromotions([existingPromo.id])
    }

    // Create new promotion
    const newPromo = await promotionService.createPromotions({
      code: FREE_SHIPPING_PROMO_CODE,
      type: "standard",
      is_automatic: true,
      status: "active",
      rules: [
        {
          attribute: "currency_code",
          operator: "in",
          values: ["ron", "RON", "eur", "EUR"],
        },
        {
          attribute: "item_total",
          operator: "gte",
          values: [input.free_shipping_threshold.toString()],
        },
      ],
      application_method: {
        type: "percentage",
        target_type: "shipping_methods",
        value: 100,
        allocation: "each",
        max_quantity: 1,
      },
    })

    return new StepResponse(
      {
        action: existingPromo ? "updated" : "created",
        promotionId: newPromo.id,
      },
      existingPromo?.id || null
    )
  },
  async (previousPromoId, { container }) => {
    // Compensation: if we deleted an existing promo, we can't fully restore it
    // This is a best-effort rollback
    if (!previousPromoId) return

    // Note: Full rollback would require storing the entire previous promo state
    // For simplicity, we just log that rollback was attempted
    console.log(
      `Rollback attempted for promotion ${previousPromoId}, but full restoration is not supported`
    )
  }
)
