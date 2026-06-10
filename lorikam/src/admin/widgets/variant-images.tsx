import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import VariantImageAssigner from "../components/variant-image-assigner"

const VariantImagesWidget = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  return <VariantImageAssigner productId={product.id} />
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default VariantImagesWidget
