import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { updateShippingSettingsStep } from "./steps/update-shipping-settings"
import { syncFreeShippingPromotionStep } from "./steps/sync-free-shipping-promotion"

type UpdateShippingSettingsWorkflowInput = {
  free_shipping_threshold: number
  is_free_shipping_enabled: boolean
}

export const updateShippingSettingsWorkflow = createWorkflow(
  "update-shipping-settings",
  function (input: UpdateShippingSettingsWorkflowInput) {
    const settings = updateShippingSettingsStep(input)
    syncFreeShippingPromotionStep(input)
    return new WorkflowResponse(settings)
  }
)
