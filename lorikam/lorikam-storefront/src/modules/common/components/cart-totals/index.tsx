"use client"

import { convertToLocale } from "@lib/util/money"
import React from "react"

type CartItem = {
  unit_price?: number | null
  quantity?: number | null
  original_total?: number | null
}

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_subtotal?: number | null
    shipping_subtotal?: number | null
    original_shipping_subtotal?: number | null
    discount_subtotal?: number | null
    original_item_subtotal?: number | null
    promotions?: Array<{
      id?: string
      code?: string | null
      application_method?: {
        value?: number | string | null
        target_type?: string | null
      } | null
    }> | null
    items?: CartItem[] | null
  }
}

type Promotion = {
  id?: string
  code?: string | null
  application_method?: {
    value?: number | string | null
    target_type?: string | null
  } | null
}

// Get display name for a promotion
const getPromotionDisplayName = (promo: Promotion): string => {
  const code = promo.code || ""
  if (code.startsWith("COLLAB_")) {
    const percentage = promo.application_method?.value
    return `Reducere Colaborator (${percentage}%)`
  }
  if (code === "FREE_SHIPPING_AUTO") {
    return "Livrare Gratuită"
  }
  return code
}

// Check if free shipping promo is applied
const hasFreeShippingPromo = (
  promotions: Promotion[] | null | undefined
): boolean => {
  return (
    promotions?.some(
      (p) =>
        p.code === "FREE_SHIPPING_AUTO" ||
        (p.application_method?.target_type === "shipping_methods" &&
          p.application_method?.value === 100)
    ) ?? false
  )
}

// Get item discounts (excluding shipping discounts)
const getItemDiscounts = (
  promotions: Promotion[] | null | undefined
): Promotion[] => {
  return (
    promotions?.filter(
      (p) => p.application_method?.target_type !== "shipping_methods"
    ) ?? []
  )
}

// Calculate original subtotal from items
const calculateOriginalSubtotal = (items?: CartItem[] | null): number => {
  if (!items) return 0
  return items.reduce((sum, item) => {
    // Use original_total if available, otherwise compute from unit_price * quantity
    if (item.original_total !== undefined && item.original_total !== null) {
      return sum + item.original_total
    }
    return sum + (item.unit_price ?? 0) * (item.quantity ?? 0)
  }, 0)
}

const CartTotals: React.FC<CartTotalsProps> = ({ totals }) => {
  const {
    currency_code,
    total,
    tax_total,
    item_subtotal,
    shipping_subtotal,
    original_shipping_subtotal,
    original_item_subtotal,
    promotions,
    items,
  } = totals

  const isFreeShipping = hasFreeShippingPromo(promotions)
  const itemDiscountPromos = getItemDiscounts(promotions)

  // Calculate original subtotal - use original_item_subtotal if available, otherwise compute from items
  const computedOriginalSubtotal =
    original_item_subtotal ?? calculateOriginalSubtotal(items)
  const originalSubtotal =
    computedOriginalSubtotal > 0 ? computedOriginalSubtotal : (item_subtotal ?? 0)

  // Calculate total item discount
  const totalItemDiscount = originalSubtotal - (item_subtotal ?? 0)

  // Determine original shipping for display
  // When free shipping applies, shipping_subtotal will be 0, so we need original_shipping_subtotal
  // If original_shipping_subtotal isn't available, we use shipping_subtotal or 0
  const originalShipping = original_shipping_subtotal ?? shipping_subtotal ?? 0
  const hasShippingDiscount =
    isFreeShipping || (shipping_subtotal ?? 0) < originalShipping

  return (
    <div>
      <div className="flex flex-col gap-y-2 txt-medium text-ui-fg-subtle ">
        <div className="flex items-center justify-between">
          <span>Subtotal (fără livrare și taxe)</span>
          <span data-testid="cart-subtotal" data-value={originalSubtotal}>
            {convertToLocale({
              amount: originalSubtotal,
              currency_code,
            })}
          </span>
        </div>

        {/* Show individual item discounts */}
        {itemDiscountPromos.map((promo) => {
          const percentage = promo.application_method?.value ?? 0
          const discountAmount = (originalSubtotal * Number(percentage)) / 100

          return (
            <div
              key={promo.id}
              className="flex items-center justify-between text-ui-fg-interactive"
            >
              <span>{getPromotionDisplayName(promo)}</span>
              <span data-testid="cart-item-discount">
                - {convertToLocale({ amount: discountAmount, currency_code })}
              </span>
            </div>
          )
        })}

        <div className="flex items-center justify-between">
          <span>Livrare</span>
          <span
            data-testid="cart-shipping"
            data-value={shipping_subtotal || 0}
            className={isFreeShipping ? "text-ui-fg-interactive" : ""}
          >
            {isFreeShipping ? (
              originalShipping > 0 ? (
                <span className="flex items-center gap-x-2">
                  <span className="line-through text-ui-fg-muted">
                    {convertToLocale({ amount: originalShipping, currency_code })}
                  </span>
                  <span>Gratuit</span>
                </span>
              ) : (
                "Gratuit"
              )
            ) : (shipping_subtotal ?? 0) > 0 ? (
              convertToLocale({
                amount: shipping_subtotal ?? 0,
                currency_code,
              })
            ) : (
              "-"
            )}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="flex gap-x-1 items-center ">Taxe</span>
          <span data-testid="cart-taxes" data-value={tax_total || 0}>
            {convertToLocale({ amount: tax_total ?? 0, currency_code })}
          </span>
        </div>
      </div>
      <div className="h-px w-full border-b border-gray-200 my-4" />
      <div className="flex items-center justify-between text-ui-fg-base mb-2 txt-medium ">
        <span>Total</span>
        <span
          className="txt-xlarge-plus"
          data-testid="cart-total"
          data-value={total || 0}
        >
          {convertToLocale({ amount: total ?? 0, currency_code })}
        </span>
      </div>
      <div className="h-px w-full border-b border-gray-200 mt-4" />
    </div>
  )
}

export default CartTotals
