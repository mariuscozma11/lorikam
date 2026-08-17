"use client"

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"
import { updateLineItem } from "@lib/data/cart"
import customizationLabel from "@lib/util/customization-label"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Button, clx } from "@medusajs/ui"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ShoppingBag from "@modules/common/icons/shopping-bag"
import Thumbnail from "@modules/products/components/thumbnail"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useRef, useState } from "react"

// Matches the cap the cart page uses until real inventory is wired up.
const MAX_QUANTITY = 10

type CartLineProps = {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
}

const CartLine = ({ item, currencyCode }: CartLineProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const customizations = item.metadata?.customizations as
    | Record<string, string>
    | undefined

  const setQuantity = async (quantity: number) => {
    if (quantity < 1 || quantity > MAX_QUANTITY) {
      return
    }

    setError(null)
    setUpdating(true)

    await updateLineItem({ lineId: item.id, quantity })
      .catch((err) => setError(err.message))
      .finally(() => setUpdating(false))
  }

  const stepperButton =
    "w-7 h-7 grid place-items-center rounded-full text-ui-fg-subtle transition-colors hover:text-ui-fg-base hover:bg-black/[0.04] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ui-fg-subtle"

  return (
    <li
      className="group/line flex gap-x-3 px-5 py-4"
      data-testid="cart-item"
    >
      <LocalizedClientLink
        href={`/products/${item.product_handle}`}
        className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-ui-bg-subtle ring-1 ring-black/[0.05]"
        tabIndex={-1}
        aria-hidden
      >
        <Thumbnail
          thumbnail={(item.variant as any)?.images?.[0]?.url || item.thumbnail}
          images={item.variant?.product?.images}
          size="square"
        />
      </LocalizedClientLink>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-x-2">
          <LocalizedClientLink
            href={`/products/${item.product_handle}`}
            className="text-sm font-medium leading-snug line-clamp-2 hover:underline underline-offset-2"
            data-testid="product-link"
          >
            {item.title}
          </LocalizedClientLink>

          {/* Kept out of the way until the row is hovered or tabbed into. */}
          <DeleteButton
            id={item.id}
            className="shrink-0 -mt-1 -mr-1 opacity-0 transition-opacity group-hover/line:opacity-100 focus-within:opacity-100"
            data-testid="cart-item-remove-button"
          />
        </div>

        {item.variant?.title && (
          <p
            className="mt-0.5 text-xs text-ui-fg-subtle truncate"
            data-testid="cart-item-variant"
          >
            {item.variant.title}
          </p>
        )}

        {customizations && (
          <ul className="mt-1 space-y-0.5">
            {Object.entries(customizations).map(([key, value]) => (
              <li key={key} className="text-xs text-ui-fg-muted truncate">
                {customizationLabel(
                  key,
                  item.metadata?.customization_labels as Record<string, string>
                )}
                : {value}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-2 flex items-center justify-between gap-x-2">
          <div className="inline-flex items-center h-7 rounded-full ring-1 ring-inset ring-black/[0.09]">
            <button
              type="button"
              onClick={() => setQuantity(item.quantity - 1)}
              disabled={updating || item.quantity <= 1}
              className={stepperButton}
              aria-label="Scade cantitatea"
            >
              <span aria-hidden>−</span>
            </button>
            <span
              className={clx(
                "w-6 text-center text-xs tabular-nums transition-opacity",
                updating && "opacity-40"
              )}
              data-testid="cart-item-quantity"
              data-value={item.quantity}
            >
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(item.quantity + 1)}
              disabled={updating || item.quantity >= MAX_QUANTITY}
              className={stepperButton}
              aria-label="Crește cantitatea"
            >
              <span aria-hidden>+</span>
            </button>
          </div>

          <LineItemPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </div>

        {error && (
          <p className="mt-1 text-xs text-ui-fg-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </li>
  )
}

const CartDropdown = ({
  cart: cartState,
}: {
  cart?: HttpTypes.StoreCart | null
}) => {
  const [activeTimer, setActiveTimer] = useState<NodeJS.Timer | undefined>(
    undefined
  )
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)

  const open = () => setCartDropdownOpen(true)
  const close = () => setCartDropdownOpen(false)

  const totalItems =
    cartState?.items?.reduce((acc, item) => {
      return acc + item.quantity
    }, 0) || 0

  // Calculate original subtotal from items (before discounts)
  const originalSubtotal =
    cartState?.items?.reduce((acc, item) => {
      return acc + (item.original_total ?? item.total ?? 0)
    }, 0) ?? 0
  // Discounted subtotal - calculate from items for consistency
  const discountedSubtotal =
    cartState?.items?.reduce((acc, item) => {
      return acc + (item.total ?? 0)
    }, 0) ?? 0
  const hasDiscount = originalSubtotal > discountedSubtotal && discountedSubtotal > 0
  const itemRef = useRef<number>(totalItems || 0)

  const timedOpen = () => {
    open()

    const timer = setTimeout(close, 5000)

    setActiveTimer(timer)
  }

  const openAndCancel = () => {
    if (activeTimer) {
      clearTimeout(activeTimer)
    }

    open()
  }

  // Clean up the timer when the component unmounts
  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer)
      }
    }
  }, [activeTimer])

  const pathname = usePathname()

  // open cart dropdown when modifying the cart items, but only if we're not on the cart page
  useEffect(() => {
    if (itemRef.current !== totalItems && !pathname.includes("/cart")) {
      timedOpen()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalItems, itemRef.current])

  // Copy before sorting — `items` belongs to the cart passed in as a prop.
  const items = [...(cartState?.items ?? [])].sort((a, b) =>
    (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
  )

  return (
    <div
      className="h-full z-50"
      onMouseEnter={openAndCancel}
      onMouseLeave={close}
    >
      <Popover className="relative h-full flex items-center">
        <PopoverButton className="flex outline-none">
          <LocalizedClientLink
            className="relative flex items-center justify-center w-10 h-10 rounded-full text-ui-fg-subtle hover:text-ui-fg-base hover:bg-black/[0.04] active:scale-95 transition-[color,background-color,transform] duration-200"
            href="/cart"
            data-testid="nav-cart-link"
            aria-label={`Coș (${totalItems})`}
          >
            <ShoppingBag size="20" />
            {totalItems > 0 && (
              <span
                className="absolute top-1 right-0.5 flex items-center justify-center min-w-[17px] h-[17px] px-1 rounded-full bg-ui-fg-base text-white text-[10px] font-semibold leading-none ring-2 ring-white tabular-nums"
                data-testid="cart-item-count"
              >
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </LocalizedClientLink>
        </PopoverButton>
        <Transition
          show={cartDropdownOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 -translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 -translate-y-1"
        >
          <PopoverPanel
            static
            // The gap to the header lives in this wrapper's padding, not as
            // empty space: the pointer stays inside the panel on its way
            // down, so the hover-to-open bridge survives.
            className="hidden small:block absolute top-full right-0 pt-2.5"
            data-testid="nav-cart-dropdown"
          >
            <div className="flex flex-col w-[400px] rounded-2xl bg-white border border-black/[0.07] shadow-[0_28px_48px_-24px_rgba(0,0,0,0.4)] text-ui-fg-base overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06]">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                  Coș
                </h3>
                {totalItems > 0 && (
                  <span className="text-[11px] text-ui-fg-muted tabular-nums">
                    {totalItems} {totalItems === 1 ? "produs" : "produse"}
                  </span>
                )}
              </div>

              {items.length ? (
                <>
                  <ul className="max-h-[22rem] overflow-y-auto overscroll-contain divide-y divide-black/[0.05]">
                    {items.map((item) => (
                      <CartLine
                        key={item.id}
                        item={item}
                        currencyCode={cartState!.currency_code}
                      />
                    ))}
                  </ul>

                  <div className="border-t border-black/[0.06] p-5">
                    <div className="flex items-start justify-between gap-x-4">
                      <div>
                        <span className="text-sm font-medium">Subtotal</span>
                        <span className="block text-[11px] text-ui-fg-muted mt-0.5">
                          TVA inclus · livrarea se adaugă la checkout
                        </span>
                      </div>
                      <span
                        className="flex flex-col items-end shrink-0"
                        data-testid="cart-subtotal"
                        data-value={discountedSubtotal}
                      >
                        {hasDiscount && (
                          <span className="text-xs line-through text-ui-fg-muted tabular-nums">
                            {convertToLocale({
                              amount: originalSubtotal,
                              currency_code: cartState!.currency_code,
                            })}
                          </span>
                        )}
                        <span
                          className={clx(
                            "text-base font-semibold tabular-nums",
                            hasDiscount && "text-ui-fg-interactive"
                          )}
                        >
                          {convertToLocale({
                            amount: discountedSubtotal,
                            currency_code: cartState!.currency_code,
                          })}
                        </span>
                      </span>
                    </div>

                    <LocalizedClientLink href="/cart" passHref>
                      <Button
                        className="w-full mt-4"
                        size="large"
                        data-testid="go-to-cart-button"
                      >
                        Vezi coșul
                      </Button>
                    </LocalizedClientLink>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-y-3 px-5 py-14 text-center">
                  <div className="w-12 h-12 rounded-full bg-ui-bg-subtle grid place-items-center text-ui-fg-muted">
                    <ShoppingBag size="22" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Coșul tău este gol</p>
                    <p className="mt-1 text-xs text-ui-fg-muted">
                      Adaugă produse ca să le vezi aici.
                    </p>
                  </div>
                  <LocalizedClientLink href="/store" onClick={close}>
                    <span className="sr-only">Mergi la pagina cu produse</span>
                    <Button variant="secondary" size="small">
                      Explorează produse
                    </Button>
                  </LocalizedClientLink>
                </div>
              )}
            </div>
          </PopoverPanel>
        </Transition>
      </Popover>
    </div>
  )
}

export default CartDropdown
