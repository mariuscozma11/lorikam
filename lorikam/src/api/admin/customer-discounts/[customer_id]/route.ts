import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CUSTOMER_DISCOUNT_MODULE } from "../../../../modules/customer-discount"
import CustomerDiscountModuleService from "../../../../modules/customer-discount/service"
import { UpdateCustomerDiscountType } from "../validators"
import { updateCustomerDiscountWorkflow } from "../../../../workflows/update-customer-discount"
import { getPromotionCode } from "../../../../workflows/steps/sync-customer-promotion"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerDiscountService: CustomerDiscountModuleService =
    req.scope.resolve(CUSTOMER_DISCOUNT_MODULE)

  const { customer_id } = req.params

  const [discount] = await customerDiscountService.listCustomerDiscounts({
    customer_id,
  })

  res.json({
    customer_discount: discount || null,
  })
}

export const PUT = async (
  req: AuthenticatedMedusaRequest<UpdateCustomerDiscountType>,
  res: MedusaResponse
) => {
  const customerDiscountService: CustomerDiscountModuleService =
    req.scope.resolve(CUSTOMER_DISCOUNT_MODULE)

  const { customer_id } = req.params
  const { discount_percentage, is_active, notes } = req.validatedBody

  // Find the existing discount
  const [existingDiscount] = await customerDiscountService.listCustomerDiscounts({
    customer_id,
  })

  if (!existingDiscount) {
    return res.status(404).json({
      message: "Customer discount not found",
    })
  }

  const discount = await customerDiscountService.updateCustomerDiscounts({
    id: existingDiscount.id,
    ...(discount_percentage !== undefined && { discount_percentage }),
    ...(is_active !== undefined && { is_active }),
    ...(notes !== undefined && { notes }),
  })

  // Sync the promotion for this customer
  const finalDiscountPercentage = discount_percentage ?? existingDiscount.discount_percentage
  const finalIsActive = is_active ?? existingDiscount.is_active

  await updateCustomerDiscountWorkflow(req.scope).run({
    input: {
      customer_id,
      discount_percentage: finalDiscountPercentage,
      is_active: finalIsActive,
    },
  })

  const promotionCode = getPromotionCode(customer_id)

  res.json({
    customer_discount: discount,
    promotion_code: promotionCode,
  })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerDiscountService: CustomerDiscountModuleService =
    req.scope.resolve(CUSTOMER_DISCOUNT_MODULE)

  const { customer_id } = req.params

  const [existingDiscount] = await customerDiscountService.listCustomerDiscounts({
    customer_id,
  })

  if (!existingDiscount) {
    return res.status(404).json({
      message: "Customer discount not found",
    })
  }

  await customerDiscountService.deleteCustomerDiscounts(existingDiscount.id)

  // Delete the promotion for this customer (by setting discount to 0/inactive)
  await updateCustomerDiscountWorkflow(req.scope).run({
    input: {
      customer_id,
      discount_percentage: 0,
      is_active: false,
    },
  })

  res.json({
    success: true,
  })
}
