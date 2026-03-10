import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { IPromotionModuleService } from "@medusajs/framework/types"

type SyncCustomerPromotionInput = {
  customer_id: string
  discount_percentage: number
  is_active: boolean
}

type StepResult = {
  action: "created" | "updated" | "deleted" | "none"
  promotionId?: string
  promotionCode?: string
}

const getPromotionCode = (customerId: string) =>
  `COLLAB_${customerId.slice(-8).toUpperCase()}`

export const syncCustomerPromotionStep = createStep(
  "sync-customer-promotion-step",
  async (
    input: SyncCustomerPromotionInput,
    { container }
  ): Promise<StepResponse<StepResult, string | null>> => {
    const promotionService: IPromotionModuleService =
      container.resolve(Modules.PROMOTION)

    const promoCode = getPromotionCode(input.customer_id)

    // Find existing promotion for this customer
    const existingPromos = await promotionService.listPromotions({
      code: promoCode,
    })
    const existingPromo = existingPromos[0]

    // If discount is disabled or 0, delete existing promo if it exists
    if (!input.is_active || input.discount_percentage <= 0) {
      if (existingPromo) {
        await promotionService.deletePromotions([existingPromo.id])
        return new StepResponse(
          { action: "deleted", promotionId: existingPromo.id },
          existingPromo.id
        )
      }
      return new StepResponse({ action: "none" }, null)
    }

    // Delete existing promo to recreate with new values
    if (existingPromo) {
      await promotionService.deletePromotions([existingPromo.id])
    }

    // Create new promotion for this customer
    // Using is_automatic: false so the customer needs to "apply" it
    // But since the code is unique to them, it's effectively tied to their account
    const newPromo = await promotionService.createPromotions({
      code: promoCode,
      type: "standard",
      is_automatic: false,
      status: "active",
      rules: [
        {
          attribute: "currency_code",
          operator: "in",
          values: ["ron", "RON", "eur", "EUR"],
        },
      ],
      application_method: {
        type: "percentage",
        target_type: "items",
        value: input.discount_percentage,
        allocation: "across",
      },
    })

    return new StepResponse(
      {
        action: existingPromo ? "updated" : "created",
        promotionId: newPromo.id,
        promotionCode: promoCode,
      },
      existingPromo?.id || null
    )
  },
  async (previousPromoId, { container }) => {
    if (!previousPromoId) return
    console.log(
      `Rollback attempted for promotion ${previousPromoId}, but full restoration is not supported`
    )
  }
)

export { getPromotionCode }
