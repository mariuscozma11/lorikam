import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { syncCustomerPromotionStep } from "./steps/sync-customer-promotion"

type UpdateCustomerDiscountWorkflowInput = {
  customer_id: string
  discount_percentage: number
  is_active: boolean
}

export const updateCustomerDiscountWorkflow = createWorkflow(
  "update-customer-discount",
  function (input: UpdateCustomerDiscountWorkflowInput) {
    const result = syncCustomerPromotionStep(input)
    return new WorkflowResponse(result)
  }
)
