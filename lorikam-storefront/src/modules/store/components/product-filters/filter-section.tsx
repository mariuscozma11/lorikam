"use client"

import { ChevronDown } from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import { useState } from "react"

type FilterSectionProps = {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

export default function FilterSection({
  title,
  children,
  defaultOpen = true,
  className,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={clx("border-b border-ui-border-base pb-4", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-2 text-left small:pointer-events-none"
      >
        <span className="text-sm font-semibold text-ui-fg-base">{title}</span>
        <ChevronDown
          className={clx(
            "h-4 w-4 text-ui-fg-muted transition-transform small:hidden",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={clx(
          "overflow-hidden transition-all duration-200",
          "small:max-h-none small:opacity-100",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="pt-2">{children}</div>
      </div>
    </div>
  )
}
