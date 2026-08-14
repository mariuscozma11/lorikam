export type NavLink = {
  href: string
  label: string
  /** Renders the team picker instead of a plain link on desktop. */
  hasTeams?: boolean
}

export const NAV_LINKS: NavLink[] = [
  { href: "/store", label: "Magazin" },
  { href: "/lorikam", label: "Lorikam Shop" },
  { href: "/fan-shop", label: "Fan Shop", hasTeams: true },
  { href: "/about", label: "Despre" },
  { href: "/contact", label: "Contact" },
]

/**
 * `usePathname()` gives us "/ro/fan-shop" while links are written as
 * "/fan-shop", so drop the locale segment before comparing.
 */
export const stripCountryCode = (pathname: string) =>
  pathname.replace(/^\/[a-z]{2}(?=\/|$)/i, "") || "/"

export const isActivePath = (pathname: string, href: string) => {
  const path = stripCountryCode(pathname)
  return href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`)
}
