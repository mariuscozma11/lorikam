import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type LineItemUnitPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
  currencyCode: string
}

const LineItemUnitPrice = ({
  item,
  style = "default",
  currencyCode,
}: LineItemUnitPriceProps) => {
  const { total, original_total } = item
  const quantity = item.quantity ?? 1
  const originalUnitPrice = (original_total ?? 0) / quantity
  const currentUnitPrice = (total ?? 0) / quantity
  const hasReducedPrice = currentUnitPrice < originalUnitPrice

  return (
    <div className="flex flex-col text-ui-fg-muted justify-center h-full">
      {hasReducedPrice && (
        <span
          className="line-through text-ui-fg-muted"
          data-testid="product-unit-original-price"
        >
          {convertToLocale({
            amount: originalUnitPrice,
            currency_code: currencyCode,
          })}
        </span>
      )}
      <span
        className={hasReducedPrice ? "text-ui-fg-interactive" : "text-base-regular"}
        data-testid="product-unit-price"
      >
        {convertToLocale({
          amount: currentUnitPrice,
          currency_code: currencyCode,
        })}
      </span>
    </div>
  )
}

export default LineItemUnitPrice
