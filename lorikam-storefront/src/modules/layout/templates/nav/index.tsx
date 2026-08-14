import { Suspense } from "react"

import { getCustomerDiscount } from "@lib/data/customer"
import { getTeams } from "@lib/data/teams"
import { getSiteImage } from "@lib/data/site-settings"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ShoppingBag from "@modules/common/icons/shopping-bag"
import CartButton from "@modules/layout/components/cart-button"
import NavBar from "@modules/layout/components/nav-bar"

export default async function Nav() {
  const [customerDiscount, teams, logo] = await Promise.all([
    getCustomerDiscount(),
    getTeams(),
    getSiteImage("logo", "/logo-retina.png"),
  ])

  return (
    <NavBar
      logo={logo}
      teams={teams}
      isCollaborator={customerDiscount?.is_collaborator ?? false}
      discountPercentage={
        customerDiscount?.customer_discount?.is_active
          ? customerDiscount.customer_discount.discount_percentage
          : null
      }
      cartSlot={
        <Suspense
          fallback={
            <LocalizedClientLink
              className="relative flex items-center justify-center w-10 h-10 rounded-full text-ui-fg-subtle hover:text-ui-fg-base hover:bg-black/[0.04] transition-colors"
              href="/cart"
              data-testid="nav-cart-link"
              aria-label="Coș (0)"
            >
              <ShoppingBag size="20" />
            </LocalizedClientLink>
          }
        >
          <CartButton />
        </Suspense>
      }
    />
  )
}
