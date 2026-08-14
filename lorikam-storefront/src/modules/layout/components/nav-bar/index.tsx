"use client"

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"
import { ChevronDown } from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useState } from "react"

import { Team } from "@lib/data/teams"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import User from "@modules/common/icons/user"
import SideMenu from "@modules/layout/components/side-menu"
import TeamAvatar from "@modules/layout/components/team-avatar"
import { NAV_LINKS, isActivePath } from "@modules/layout/components/nav-links"

type NavBarProps = {
  logo: string
  teams: Team[]
  isCollaborator: boolean
  discountPercentage?: number | null
  /** Rendered on the server so the cart stays a server component. */
  cartSlot: React.ReactNode
}

const linkClass =
  "group relative flex items-center h-full gap-x-1.5 px-3.5 text-[11px] font-medium uppercase tracking-[0.14em] whitespace-nowrap outline-none"

const iconButtonClass =
  "relative flex items-center justify-center w-10 h-10 rounded-full text-ui-fg-subtle hover:text-ui-fg-base hover:bg-black/[0.04] active:scale-95 transition-[color,background-color,transform] duration-200"

const Underline = ({ active }: { active: boolean }) => (
  <span
    aria-hidden
    className={clx(
      "absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-ui-fg-base origin-left",
      "transition-transform duration-300 ease-out",
      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
    )}
  />
)

const NavBar = ({
  logo,
  teams,
  isCollaborator,
  discountPercentage,
  cartSlot,
}: NavBarProps) => {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  // Condense the bar once the page moves so the hero gets the full viewport
  // but navigation stays reachable.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })

    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="sticky top-0 inset-x-0 z-50">
      {isCollaborator && (
        <div
          className={clx(
            "bg-ui-fg-base text-white overflow-hidden",
            "transition-[max-height,opacity] duration-300 ease-out",
            scrolled ? "max-h-0 opacity-0" : "max-h-10 opacity-100"
          )}
          data-testid="collaborator-banner"
        >
          <div className="content-container flex items-center justify-center gap-x-2 h-8 xsmall:h-9">
            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-white/70" />
            {/* The full sentence overflows a phone-width bar, so keep a
                shortened variant for small screens. */}
            <span className="truncate text-[10px] xsmall:text-[11px] uppercase tracking-[0.08em] xsmall:tracking-[0.14em]">
              <span className="xsmall:hidden">
                Colaborator
                {discountPercentage ? ` · −${discountPercentage}%` : ""}
              </span>
              <span className="hidden xsmall:inline">
                Cont colaborator
                {discountPercentage
                  ? ` — ${discountPercentage}% reducere aplicată automat`
                  : " — prețuri speciale active"}
              </span>
            </span>
          </div>
        </div>
      )}

      <header
        className={clx(
          "relative border-b",
          "transition-[height,background-color,border-color,box-shadow] duration-300 ease-out",
          scrolled
            ? "h-14 small:h-16 bg-white/85 backdrop-blur-xl border-black/[0.07] shadow-[0_10px_30px_-24px_rgba(0,0,0,0.6)]"
            : "h-16 small:h-20 bg-white border-black/[0.05]"
        )}
      >
        <nav className="content-container flex items-center justify-between h-full gap-x-4">
          {/* Logo */}
          <div className="flex items-center flex-1 basis-0">
            <LocalizedClientLink
              href="/"
              className="flex items-center rounded-md transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg-base/20"
              data-testid="nav-store-link"
            >
              <Image
                src={logo}
                alt="Lorikam"
                width={446}
                height={104}
                priority
                className={clx(
                  "w-auto transition-[height] duration-300 ease-out",
                  scrolled ? "h-7 small:h-8" : "h-8 small:h-10"
                )}
              />
            </LocalizedClientLink>
          </div>

          {/* Desktop links */}
          <div className="hidden small:flex items-center h-full">
            {NAV_LINKS.map((link) => {
              const active = isActivePath(pathname, link.href)

              if (!link.hasTeams) {
                return (
                  <LocalizedClientLink
                    key={link.href}
                    href={link.href}
                    className={clx(
                      linkClass,
                      "transition-colors",
                      active
                        ? "text-ui-fg-base"
                        : "text-ui-fg-subtle hover:text-ui-fg-base"
                    )}
                    data-testid={`nav-${link.href.slice(1)}-link`}
                  >
                    {link.label}
                    <Underline active={active} />
                  </LocalizedClientLink>
                )
              }

              return (
                <Popover key={link.href} className="h-full flex">
                  {({ open, close }) => (
                    <>
                      <PopoverButton
                        className={clx(
                          linkClass,
                          "transition-colors",
                          active || open
                            ? "text-ui-fg-base"
                            : "text-ui-fg-subtle hover:text-ui-fg-base"
                        )}
                        data-testid="fan-shop-dropdown"
                      >
                        {link.label}
                        <ChevronDown
                          className={clx(
                            "w-3.5 h-3.5 transition-transform duration-300 ease-out",
                            open && "rotate-180"
                          )}
                        />
                        <Underline active={active || open} />
                      </PopoverButton>

                      <Transition
                        as={Fragment}
                        enter="transition duration-200 ease-out"
                        enterFrom="opacity-0 -translate-y-2"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition duration-150 ease-in"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 -translate-y-2"
                      >
                        {/* Anchored to <header>, which is the nearest
                            positioned ancestor, so the panel spans the bar. */}
                        <PopoverPanel className="absolute left-0 right-0 top-full">
                          <div className="bg-white border-b border-black/[0.07] shadow-[0_28px_48px_-32px_rgba(0,0,0,0.5)]">
                            <div className="content-container grid grid-cols-[minmax(0,15rem)_1fr] gap-x-12 py-8">
                              <div>
                                <p className="text-[10px] uppercase tracking-[0.16em] text-ui-fg-muted">
                                  Fan Shop
                                </p>
                                <h3 className="mt-2 text-xl font-semibold text-ui-fg-base">
                                  Echipamentul echipei tale
                                </h3>
                                <p className="mt-2 text-sm text-ui-fg-subtle">
                                  Produse oficiale ale cluburilor partenere
                                  Lorikam.
                                </p>
                                <LocalizedClientLink
                                  href="/fan-shop"
                                  onClick={() => close()}
                                  className="group/all mt-5 inline-flex items-center gap-x-2 pb-0.5 text-sm font-medium text-ui-fg-base border-b border-ui-fg-base/25 hover:border-ui-fg-base transition-colors"
                                >
                                  Vezi toate echipele
                                  <span
                                    aria-hidden
                                    className="transition-transform duration-200 group-hover/all:translate-x-1"
                                  >
                                    →
                                  </span>
                                </LocalizedClientLink>
                              </div>

                              {teams.length ? (
                                <div className="grid grid-cols-2 medium:grid-cols-3 gap-x-2 gap-y-1 content-start">
                                  {teams.map((team) => (
                                    <LocalizedClientLink
                                      key={team.id}
                                      href={`/fan-shop/${team.handle}`}
                                      onClick={() => close()}
                                      className="group/team relative flex items-center gap-x-3 rounded-lg pl-4 pr-3 py-2.5 hover:bg-ui-bg-subtle transition-colors"
                                    >
                                      <span
                                        aria-hidden
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 rounded-full transition-[height] duration-200 ease-out group-hover/team:h-7"
                                        style={{
                                          backgroundColor:
                                            team.primary_color || "#111827",
                                        }}
                                      />
                                      <TeamAvatar
                                        team={team}
                                        className="w-9 h-9 text-xs"
                                      />
                                      <span className="text-sm text-ui-fg-subtle group-hover/team:text-ui-fg-base transition-colors truncate">
                                        {team.name}
                                      </span>
                                    </LocalizedClientLink>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-ui-fg-muted self-center">
                                  Echipele partenere apar aici în curând.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Dim the page behind the panel. */}
                          <div
                            aria-hidden
                            onClick={() => close()}
                            className="h-screen bg-black/20"
                          />
                        </PopoverPanel>
                      </Transition>
                    </>
                  )}
                </Popover>
              )
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-x-0.5 flex-1 basis-0">
            <LocalizedClientLink
              href="/account"
              className={clx(iconButtonClass, "hidden small:flex")}
              data-testid="nav-account-link"
              aria-label="Cont"
            >
              <User size="20" />
            </LocalizedClientLink>

            {cartSlot}

            <div className="small:hidden ml-0.5">
              <SideMenu teams={teams} />
            </div>
          </div>
        </nav>
      </header>
    </div>
  )
}

export default NavBar
