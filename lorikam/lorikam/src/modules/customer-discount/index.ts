import { Module } from "@medusajs/framework/utils"
import CustomerDiscountService from "./service"

export const CUSTOMER_DISCOUNT_MODULE = "customerDiscount"

export default Module(CUSTOMER_DISCOUNT_MODULE, {
  service: CustomerDiscountService,
})
