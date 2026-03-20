"use client"

import { useCallback } from "react"
import { clx } from "@medusajs/ui"
import FilterSection from "./filter-section"
import { Color } from "@lib/data/colors"

type ColorFilterProps = {
  colors: Color[]
  selectedColors: string[]
  onChange: (colors: string[]) => void
}

function ColorSwatch({ color, size = "md" }: { color: Color; size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "w-4 h-4" : "w-6 h-6"

  if (color.hex_codes.length === 0) {
    return (
      <div
        className={clx(sizeClasses, "rounded-full bg-ui-bg-subtle border border-ui-border-base")}
        title={color.name}
      />
    )
  }

  if (color.hex_codes.length === 1) {
    return (
      <div
        className={clx(sizeClasses, "rounded-full border border-ui-border-base")}
        style={{ backgroundColor: color.hex_codes[0] }}
        title={color.name}
      />
    )
  }

  // Multiple colors - show gradient
  const gradient = `linear-gradient(135deg, ${color.hex_codes.join(", ")})`
  return (
    <div
      className={clx(sizeClasses, "rounded-full border border-ui-border-base")}
      style={{ background: gradient }}
      title={color.name}
    />
  )
}

export default function ColorFilter({
  colors,
  selectedColors,
  onChange,
}: ColorFilterProps) {
  const handleToggle = useCallback(
    (colorId: string) => {
      if (selectedColors.includes(colorId)) {
        onChange(selectedColors.filter((id) => id !== colorId))
      } else {
        onChange([...selectedColors, colorId])
      }
    },
    [selectedColors, onChange]
  )

  if (colors.length === 0) {
    return null
  }

  // Sort colors by display_order
  const sortedColors = [...colors].sort(
    (a, b) => (a.display_order || 0) - (b.display_order || 0)
  )

  return (
    <FilterSection title="Culoare">
      <div className="flex flex-wrap gap-2">
        {sortedColors.map((color) => {
          const isSelected = selectedColors.includes(color.id)
          return (
            <button
              key={color.id}
              type="button"
              onClick={() => handleToggle(color.id)}
              className={clx(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors",
                isSelected
                  ? "border-ui-fg-base bg-ui-bg-subtle-pressed"
                  : "border-ui-border-base bg-ui-bg-base hover:bg-ui-bg-subtle"
              )}
              title={color.name}
            >
              <ColorSwatch color={color} size="sm" />
              <span className="text-ui-fg-base">{color.name}</span>
            </button>
          )
        })}
      </div>
    </FilterSection>
  )
}
