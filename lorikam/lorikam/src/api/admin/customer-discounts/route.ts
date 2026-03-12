import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CUSTOMER_DISCOUNT_MODULE } from "../../../modules/customer-discount"
import CustomerDiscountModuleService from "../../../modules/customer-discount/service"
import { CreateCustomerDiscountType } from "./validators"
import { updateCustomerDiscountWorkflow } from "../../../workflows/update-customer-discount"
import { getPromotionCode } from "../../../workflows/steps/sync-customer-promotion"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerDiscountService: CustomerDiscountModuleService =
    req.scope.resolve(CUSTOMER_DISCOUNT_MODULE)

  const discounts = await customerDiscountService.listCustomerDiscounts()

  res.json({
    customer_discounts: discounts,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<CreateCustomerDiscountType>,
  res: MedusaResponse
) => {
  const customerDiscountService: CustomerDiscountModuleService =
    req.scope.resolve(CUSTOMER_DISCOUNT_MODULE)

  const { customer_id, discount_percentage, is_active, is_collaborator, notes } = req.validatedBody

  // Check if a discount already exists for this customer
  const [existingDiscount] = await customerDiscountService.listCustomerDiscounts({
    customer_id,
  })

  let discount
  if (existingDiscount) {
    // Update existing discount
    discount = await customerDiscountService.updateCustomerDiscounts({
      id: existingDiscount.id,
      discount_percentage,
      is_active: is_active ?? true,
      is_collaborator: is_collaborator ?? false,
      notes,
    })
  } else {
    // Create new discount
    discount = await customerDiscountService.createCustomerDiscounts({
      customer_id,
      discount_percentage,
      is_active: is_active ?? true,
      is_collaborator: is_collaborator ?? false,
      notes,
    })
  }

  // Create/update the promotion for this customer
  await updateCustomerDiscountWorkflow(req.scope).run({
    input: {
      customer_id,
      discount_percentage,
      is_active: is_active ?? true,
    },
  })

  // Get the promotion code for this customer
  const promotionCode = getPromotionCode(customer_id)

  res.json({
    customer_discount: discount,
    promotion_code: promotionCode,
  })
}
