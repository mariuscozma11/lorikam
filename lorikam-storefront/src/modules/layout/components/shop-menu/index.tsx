"use client"

import { Popover, PopoverButton, PopoverPanel, Transition } from "@headlessui/react"
import { ChevronDown } from "@medusajs/icons"
import { Fragment } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Team } from "@lib/data/teams"

type ShopMenuProps = {
  teams: Team[]
}

export default function ShopMenu({ teams }: ShopMenuProps) {
  return (
    <div className="flex items-center gap-x-6 h-full">
      {/* Lorikam Shop Link */}
      <LocalizedClientLink
        href="/lorikam"
        className="hover:text-ui-fg-base transition-colors"
        data-testid="lorikam-shop-link"
      >
        Lorikam Shop
      </LocalizedClientLink>

      {/* Fan Shop Dropdown */}
      <Popover className="relative h-full flex items-center">
        {({ open, close }) => (
          <>
            <PopoverButton
              className="flex items-center gap-x-1 hover:text-ui-fg-base transition-colors focus:outline-none"
              data-testid="fan-shop-dropdown"
            >
              Fan Shop
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  open ? "rotate-180" : ""
                }`}
              />
            </PopoverButton>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <PopoverPanel className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-ui-border-base z-50">
                <div className="py-2">
                  <LocalizedClientLink
                    href="/fan-shop"
                    className="block px-4 py-2 text-sm hover:bg-ui-bg-subtle transition-colors"
                    onClick={() => close()}
                  >
                    <span className="font-medium">Toate echipele</span>
                    <span className="block text-ui-fg-subtle text-xs mt-0.5">
                      Vezi toate echipele partenere
                    </span>
                  </LocalizedClientLink>

                  {teams.length > 0 && (
                    <>
                      <div className="border-t border-ui-border-base my-2" />
                      {teams.map((team) => (
                        <LocalizedClientLink
                          key={team.id}
                          href={`/fan-shop/${team.handle}`}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-ui-bg-subtle transition-colors"
                          onClick={() => close()}
                        >
                          {team.logo ? (
                            <img
                              src={team.logo}
                              alt={team.name}
                              className="w-8 h-8 object-contain rounded"
                            />
                          ) : (
                            <div
                              className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                              style={{
                                backgroundColor: team.primary_color || "#6b7280",
                              }}
                            >
                              {team.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-sm">{team.name}</span>
                        </LocalizedClientLink>
                      ))}
                    </>
                  )}
                </div>
              </PopoverPanel>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  )
}
