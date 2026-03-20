import { Suspense } from "react"

import { getCustomerDiscount } from "@lib/data/customer"
import { getTeams } from "@lib/data/teams"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import ShopMenu from "@modules/layout/components/shop-menu"

export default async function Nav() {
  const [customerDiscount, teams] = await Promise.all([
    getCustomerDiscount(),
    getTeams(),
  ])

  const isCollaborator = customerDiscount?.is_collaborator ?? false

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className={`relative h-16 mx-auto border-b duration-200 border-ui-border-base ${isCollaborator ? "bg-gray-100" : "bg-white"}`}>
        <nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex items-center justify-between w-full h-full text-small-regular">
          {/* Left side - Shop links (desktop only) */}
          <div className="flex-1 basis-0 h-full flex items-center">
            <div className="hidden small:flex items-center gap-x-6 h-full">
              <ShopMenu teams={teams} />
            </div>
          </div>

          {/* Center - Logo */}
          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="txt-compact-xlarge-plus hover:text-ui-fg-base uppercase"
              data-testid="nav-store-link"
            >
              Lorikam
            </LocalizedClientLink>
          </div>

          {/* Right side - Account, Cart (desktop) + Mobile menu trigger */}
          <div className="flex items-center gap-x-4 h-full flex-1 basis-0 justify-end">
            {/* Desktop: Account and Cart */}
            <div className="hidden small:flex items-center gap-x-6 h-full">
              <LocalizedClientLink
                className="hover:text-ui-fg-base"
                href="/account"
                data-testid="nav-account-link"
              >
                Cont
              </LocalizedClientLink>
              <Suspense
                fallback={
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base flex gap-2"
                    href="/cart"
                    data-testid="nav-cart-link"
                  >
                    Cos (0)
                  </LocalizedClientLink>
                }
              >
                <CartButton />
              </Suspense>
            </div>

            {/* Mobile: Hamburger menu */}
            <div className="small:hidden h-full">
              <SideMenu teams={teams} />
            </div>
          </div>
        </nav>
      </header>
    </div>
  )
}
