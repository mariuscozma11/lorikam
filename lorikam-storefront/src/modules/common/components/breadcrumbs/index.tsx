import LocalizedClientLink from "@modules/common/components/localized-client-link"

export type Crumb = { label: string; href?: string }

// Breadcrumb trail. Always starts with "Acasă". The last item renders as the
// current page (not a link). Used on shop, product and content pages.
export default function Breadcrumbs({
  items,
  className = "",
}: {
  items: Crumb[]
  className?: string
}) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ui-fg-subtle">
        <li>
          <LocalizedClientLink href="/" className="hover:text-ui-fg-base">
            Acasă
          </LocalizedClientLink>
        </li>
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={i} className="flex items-center gap-2">
              <span className="text-ui-fg-muted" aria-hidden>
                /
              </span>
              {item.href && !isLast ? (
                <LocalizedClientLink
                  href={item.href}
                  className="hover:text-ui-fg-base"
                >
                  {item.label}
                </LocalizedClientLink>
              ) : (
                <span
                  className="text-ui-fg-base font-medium"
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
