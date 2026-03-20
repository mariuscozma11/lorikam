"use client"

import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import { BarsThree, ChevronDown, XMark } from "@medusajs/icons"
import { Text, clx } from "@medusajs/ui"
import { Fragment, useState } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Team } from "@lib/data/teams"

type SideMenuProps = {
  teams?: Team[]
}

const SideMenu = ({ teams = [] }: SideMenuProps) => {
  const [fanShopOpen, setFanShopOpen] = useState(false)

  return (
    <div className="h-full flex items-center">
      <Popover className="h-full flex items-center">
        {({ open, close }) => (
          <>
            <Popover.Button
              data-testid="nav-menu-button"
              className="flex items-center justify-center w-10 h-10 rounded-md transition-colors hover:bg-ui-bg-subtle focus:outline-none"
              aria-label="Deschide meniul"
            >
              <BarsThree className="w-6 h-6" />
            </Popover.Button>

            {open && (
              <div
                className="fixed inset-0 z-[50] bg-black/50"
                onClick={close}
                data-testid="side-menu-backdrop"
              />
            )}

            <Transition
              show={open}
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-x-full"
              enterTo="opacity-100 translate-x-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-x-0"
              leaveTo="opacity-0 translate-x-full"
            >
              <PopoverPanel className="fixed right-0 top-0 flex flex-col w-[85vw] max-w-sm h-full z-[51] bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between h-16 px-5 border-b border-ui-border-base">
                  <span className="text-base font-semibold">Meniu</span>
                  <button
                    data-testid="close-menu-button"
                    onClick={close}
                    className="flex items-center justify-center w-10 h-10 -mr-2 rounded-md hover:bg-ui-bg-subtle transition-colors"
                    aria-label="Inchide meniul"
                  >
                    <XMark className="w-5 h-5" />
                  </button>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto">
                  <nav className="py-3">
                    {/* Home */}
                    <LocalizedClientLink
                      href="/"
                      className="flex items-center h-12 px-5 text-base hover:bg-ui-bg-subtle transition-colors"
                      onClick={close}
                    >
                      Acasa
                    </LocalizedClientLink>

                    {/* Lorikam Shop */}
                    <LocalizedClientLink
                      href="/lorikam"
                      className="flex items-center h-12 px-5 text-base hover:bg-ui-bg-subtle transition-colors"
                      onClick={close}
                    >
                      Lorikam Shop
                    </LocalizedClientLink>

                    {/* Fan Shop Dropdown */}
                    <div>
                      <button
                        onClick={() => setFanShopOpen(!fanShopOpen)}
                        className="flex items-center justify-between w-full h-12 px-5 text-base hover:bg-ui-bg-subtle transition-colors"
                      >
                        <span>Fan Shop</span>
                        <ChevronDown
                          className={clx(
                            "w-4 h-4 transition-transform duration-200",
                            fanShopOpen && "rotate-180"
                          )}
                        />
                      </button>

                      {/* Fan Shop Submenu */}
                      <div
                        className={clx(
                          "overflow-hidden transition-all duration-200",
                          fanShopOpen ? "max-h-96" : "max-h-0"
                        )}
                      >
                        <div className="bg-ui-bg-subtle">
                          <LocalizedClientLink
                            href="/fan-shop"
                            className="flex items-center h-11 px-8 text-sm hover:bg-ui-bg-subtle-hover transition-colors"
                            onClick={close}
                          >
                            Toate echipele
                          </LocalizedClientLink>

                          {teams.map((team) => (
                            <LocalizedClientLink
                              key={team.id}
                              href={`/fan-shop/${team.handle}`}
                              className="flex items-center gap-3 h-11 px-8 text-sm hover:bg-ui-bg-subtle-hover transition-colors"
                              onClick={close}
                            >
                              {team.logo && (
                                <img
                                  src={team.logo}
                                  alt={team.name}
                                  className="w-5 h-5 object-contain rounded"
                                />
                              )}
                              <span>{team.name}</span>
                            </LocalizedClientLink>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="my-3 mx-5 border-t border-ui-border-base" />

                    {/* Account */}
                    <LocalizedClientLink
                      href="/account"
                      className="flex items-center h-12 px-5 text-base hover:bg-ui-bg-subtle transition-colors"
                      onClick={close}
                    >
                      Cont
                    </LocalizedClientLink>

                    {/* Cart */}
                    <LocalizedClientLink
                      href="/cart"
                      className="flex items-center h-12 px-5 text-base hover:bg-ui-bg-subtle transition-colors"
                      onClick={close}
                    >
                      Cos
                    </LocalizedClientLink>
                  </nav>
                </div>

                {/* Footer */}
                <div className="border-t border-ui-border-base p-5">
                  <Text className="text-xs text-ui-fg-muted">
                    © {new Date().getFullYear()} Lorikam
                  </Text>
                </div>
              </PopoverPanel>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  )
}

export default SideMenu
