import { MedusaService } from "@medusajs/framework/utils"
import CustomerDiscount from "./models/customer-discount"

class CustomerDiscountService extends MedusaService({
  CustomerDiscount,
}) {}

export default CustomerDiscountService
