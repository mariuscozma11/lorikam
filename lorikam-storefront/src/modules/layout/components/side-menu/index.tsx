"use client"

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"
import { ChevronDown, XMark } from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useState } from "react"

import { Team } from "@lib/data/teams"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ShoppingBag from "@modules/common/icons/shopping-bag"
import User from "@modules/common/icons/user"
import TeamAvatar from "@modules/layout/components/team-avatar"
import { NAV_LINKS, isActivePath } from "@modules/layout/components/nav-links"

type SideMenuProps = {
  teams?: Team[]
}

/** Keeps the drawer's entrance from feeling like everything lands at once. */
const stagger = (index: number) => ({
  animationDelay: `${80 + index * 40}ms`,
})

/**
 * Freezes the page behind the drawer. Lives in its own component because the
 * `open` flag only exists inside Popover's render prop, where hooks belong to
 * Popover rather than to us.
 */
const ScrollLock = ({ active }: { active: boolean }) => {
  useEffect(() => {
    if (!active) return

    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previous
    }
  }, [active])

  return null
}

const SideMenu = ({ teams = [] }: SideMenuProps) => {
  const pathname = usePathname()
  const [fanShopOpen, setFanShopOpen] = useState(false)

  return (
    <div className="flex items-center">
      <Popover>
        {({ open, close }) => {
          return (
            <>
              <ScrollLock active={open} />
              <PopoverButton
                data-testid="nav-menu-button"
                className="flex items-center justify-center w-10 h-10 rounded-full text-ui-fg-subtle hover:text-ui-fg-base hover:bg-black/[0.04] active:scale-95 transition-[color,background-color,transform] duration-200 outline-none"
                aria-label={open ? "Închide meniul" : "Deschide meniul"}
              >
                {/* Morphing burger — the bars fold into an X. */}
                <span className="relative w-5 h-[14px]">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={clx(
                        "absolute left-0 w-5 h-[1.5px] rounded-full bg-current transition-all duration-300 ease-out",
                        i === 0 && (open ? "top-1.5 rotate-45" : "top-0"),
                        i === 1 &&
                          (open ? "top-1.5 opacity-0 scale-x-50" : "top-1.5"),
                        i === 2 && (open ? "top-1.5 -rotate-45" : "top-3")
                      )}
                    />
                  ))}
                </span>
              </PopoverButton>

              <Transition
                show={open}
                as={Fragment}
                enter="transition-opacity duration-300 ease-out"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition-opacity duration-200 ease-in"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div
                  className="fixed inset-0 z-[50] bg-black/40 backdrop-blur-[2px]"
                  onClick={close}
                  data-testid="side-menu-backdrop"
                />
              </Transition>

              <Transition
                show={open}
                as={Fragment}
                enter="transition-transform duration-300 ease-drawer"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transition-transform duration-200 ease-in"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <PopoverPanel className="fixed right-0 top-0 flex flex-col w-[88vw] max-w-sm h-[100dvh] z-[51] bg-white shadow-[-24px_0_48px_-24px_rgba(0,0,0,0.45)]">
                  <div className="flex items-center justify-between h-16 pl-6 pr-4 shrink-0">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ui-fg-muted">
                      Meniu
                    </span>
                    <button
                      data-testid="close-menu-button"
                      onClick={close}
                      className="flex items-center justify-center w-10 h-10 rounded-full text-ui-fg-subtle hover:text-ui-fg-base hover:bg-black/[0.04] active:scale-95 transition-[color,background-color,transform] duration-200"
                      aria-label="Închide meniul"
                    >
                      <XMark className="w-5 h-5" />
                    </button>
                  </div>

                  <nav className="flex-1 overflow-y-auto px-3 pb-4">
                    {NAV_LINKS.map((link, index) => {
                      const active = isActivePath(pathname, link.href)

                      if (!link.hasTeams) {
                        return (
                          <LocalizedClientLink
                            key={link.href}
                            href={link.href}
                            onClick={close}
                            style={stagger(index)}
                            className={clx(
                              "opacity-0 animate-fade-in-right motion-reduce:animate-none motion-reduce:opacity-100",
                              "flex items-center h-14 px-3 rounded-xl text-lg transition-colors active:bg-ui-bg-subtle",
                              active
                                ? "text-ui-fg-base font-semibold"
                                : "text-ui-fg-subtle"
                            )}
                          >
                            <span
                              className={clx(
                                "w-1 h-1 rounded-full mr-3 transition-colors",
                                active ? "bg-ui-fg-base" : "bg-transparent"
                              )}
                            />
                            {link.label}
                          </LocalizedClientLink>
                        )
                      }

                      return (
                        <div
                          key={link.href}
                          style={stagger(index)}
                          className="opacity-0 animate-fade-in-right motion-reduce:animate-none motion-reduce:opacity-100"
                        >
                          <div className="flex items-center rounded-xl">
                            <LocalizedClientLink
                              href={link.href}
                              onClick={close}
                              className={clx(
                                "flex items-center flex-1 h-14 px-3 rounded-xl text-lg transition-colors active:bg-ui-bg-subtle",
                                active
                                  ? "text-ui-fg-base font-semibold"
                                  : "text-ui-fg-subtle"
                              )}
                            >
                              <span
                                className={clx(
                                  "w-1 h-1 rounded-full mr-3 transition-colors",
                                  active ? "bg-ui-fg-base" : "bg-transparent"
                                )}
                              />
                              {link.label}
                            </LocalizedClientLink>

                            {teams.length > 0 && (
                              <button
                                onClick={() => setFanShopOpen((v) => !v)}
                                aria-expanded={fanShopOpen}
                                aria-label={
                                  fanShopOpen
                                    ? "Ascunde echipele"
                                    : "Arată echipele"
                                }
                                className="flex items-center justify-center w-11 h-11 rounded-full text-ui-fg-muted hover:bg-ui-bg-subtle transition-colors"
                              >
                                <ChevronDown
                                  className={clx(
                                    "w-4 h-4 transition-transform duration-300 ease-out",
                                    fanShopOpen && "rotate-180"
                                  )}
                                />
                              </button>
                            )}
                          </div>

                          <div
                            className={clx(
                              "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                              fanShopOpen
                                ? "grid-rows-[1fr] opacity-100"
                                : "grid-rows-[0fr] opacity-0"
                            )}
                          >
                            <div className="overflow-hidden">
                              <div className="ml-6 pl-3 border-l border-black/[0.08] py-1">
                                {teams.map((team) => (
                                  <LocalizedClientLink
                                    key={team.id}
                                    href={`/fan-shop/${team.handle}`}
                                    onClick={close}
                                    className="flex items-center gap-x-3 h-12 px-2 rounded-lg text-sm text-ui-fg-subtle active:bg-ui-bg-subtle transition-colors"
                                  >
                                    <TeamAvatar
                                      team={team}
                                      className="w-7 h-7 text-[10px]"
                                    />
                                    <span className="truncate">
                                      {team.name}
                                    </span>
                                  </LocalizedClientLink>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </nav>

                  <div
                    className="shrink-0 border-t border-black/[0.07] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] grid grid-cols-2 gap-2 opacity-0 animate-fade-in-right motion-reduce:animate-none motion-reduce:opacity-100"
                    style={stagger(NAV_LINKS.length)}
                  >
                    <LocalizedClientLink
                      href="/account"
                      onClick={close}
                      className="flex items-center justify-center gap-x-2 h-12 rounded-xl border border-black/[0.09] text-sm font-medium text-ui-fg-base active:bg-ui-bg-subtle transition-colors"
                    >
                      <User size="18" />
                      Cont
                    </LocalizedClientLink>
                    <LocalizedClientLink
                      href="/cart"
                      onClick={close}
                      className="flex items-center justify-center gap-x-2 h-12 rounded-xl bg-ui-fg-base text-white text-sm font-medium active:opacity-90 transition-opacity"
                    >
                      <ShoppingBag size="18" />
                      Coș
                    </LocalizedClientLink>
                  </div>
                </PopoverPanel>
              </Transition>
            </>
          )
        }}
      </Popover>
    </div>
  )
}

export default SideMenu
