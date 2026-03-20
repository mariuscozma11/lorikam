import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CUSTOMER_DISCOUNT_MODULE } from "../../../modules/customer-discount"
import CustomerDiscountModuleService from "../../../modules/customer-discount/service"
import { getPromotionCode } from "../../../workflows/steps/sync-customer-promotion"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  // Get the customer ID from the authenticated user
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    return res.json({
      customer_discount: null,
      promotion_code: null,
    })
  }

  const customerDiscountService: CustomerDiscountModuleService =
    req.scope.resolve(CUSTOMER_DISCOUNT_MODULE)

  const [discount] = await customerDiscountService.listCustomerDiscounts({
    customer_id: customerId,
  })

  if (!discount || !discount.is_active || discount.discount_percentage <= 0) {
    return res.json({
      customer_discount: null,
      promotion_code: null,
      is_collaborator: discount?.is_collaborator ?? false,
    })
  }

  const promotionCode = getPromotionCode(customerId)

  res.json({
    customer_discount: {
      discount_percentage: discount.discount_percentage,
      is_active: discount.is_active,
    },
    promotion_code: promotionCode,
    is_collaborator: discount.is_collaborator ?? false,
  })
}
