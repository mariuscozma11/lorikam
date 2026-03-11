import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import React, { useMemo } from "react"

type ColorMap = Record<string, string>

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  colorMap?: ColorMap
  variants?: HttpTypes.StoreProductVariant[] | null
  currentOptions?: Record<string, string | undefined>
  "data-testid"?: string
}

const isColorOption = (title: string): boolean => {
  const normalized = title.toLowerCase()
  return normalized === "culoare" || normalized === "culori"
}

const isValidHex = (str: string): boolean => {
  return /^#([0-9A-Fa-f]{3}){1,2}$/.test(str)
}

// Parse color value - can be single hex or comma-separated for composed colors
const parseColorValue = (value: string): string[] => {
  if (!value) return []
  return value.split(",").map((v) => v.trim()).filter(isValidHex)
}

// Render color swatch - supports single and composed colors
const ColorSwatch = ({
  hexCodes,
  size = "w-10 h-10",
}: {
  hexCodes: string[]
  size?: string
}) => {
  if (hexCodes.length === 0) return null

  if (hexCodes.length === 1) {
    return (
      <div
        className={`${size} rounded-full`}
        style={{ backgroundColor: hexCodes[0] }}
      />
    )
  }

  // For 2 colors - two half circles using clip-path
  if (hexCodes.length === 2) {
    return (
      <div className={`${size} rounded-full overflow-hidden relative`}>
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: hexCodes[0],
            clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: hexCodes[1],
            clipPath: "polygon(50% 0, 100% 0, 100% 100%, 50% 100%)",
          }}
        />
      </div>
    )
  }

  // For 3 colors - three segments
  if (hexCodes.length === 3) {
    return (
      <div className={`${size} rounded-full overflow-hidden relative`}>
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: hexCodes[0],
            clipPath: "polygon(50% 50%, 50% 0, 100% 0, 100% 50%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: hexCodes[1],
            clipPath: "polygon(50% 50%, 100% 50%, 100% 100%, 0 100%, 0 50%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: hexCodes[2],
            clipPath: "polygon(50% 50%, 0 50%, 0 0, 50% 0)",
          }}
        />
      </div>
    )
  }

  // For 4+ colors - use horizontal stripes as fallback
  return (
    <div className={`${size} rounded-full overflow-hidden flex flex-col`}>
      {hexCodes.map((hex, i) => (
        <div
          key={i}
          className="flex-1"
          style={{ backgroundColor: hex }}
        />
      ))}
    </div>
  )
}

// Unavailable overlay with red X
const UnavailableOverlay = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-full">
    <svg
      className="w-5 h-5 text-red-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  </div>
)

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
  colorMap,
  variants,
  currentOptions,
}) => {
  const filteredOptions = (option.values ?? []).map((v) => v.value)
  const isColor = isColorOption(title)

  // Check which option values are available based on current selections
  const availableValues = useMemo(() => {
    if (!variants || !currentOptions) {
      // If no variant data, assume all are available
      return new Set(filteredOptions)
    }

    const available = new Set<string>()

    for (const value of filteredOptions) {
      // Check if there's a variant that matches:
      // - This option with this value
      // - All other currently selected options
      const hasMatchingVariant = variants.some((variant) => {
        const variantOptions = variant.options?.reduce((acc, opt: any) => {
          acc[opt.option_id] = opt.value
          return acc
        }, {} as Record<string, string>)

        if (!variantOptions) return false

        // Check this option matches the value we're testing
        if (variantOptions[option.id] !== value) return false

        // Check all other selected options match
        for (const [optionId, selectedValue] of Object.entries(currentOptions)) {
          // Skip this option (we're testing different values for it)
          if (optionId === option.id) continue
          // Skip unselected options
          if (!selectedValue) continue
          // Check if variant has the same value for this option
          if (variantOptions[optionId] !== selectedValue) return false
        }

        return true
      })

      if (hasMatchingVariant) {
        available.add(value)
      }
    }

    return available
  }, [variants, currentOptions, option.id, filteredOptions])

  // For color options with a color map, render swatches
  if (isColor && colorMap && Object.keys(colorMap).length > 0) {
    return (
      <div className="flex flex-col gap-y-3">
        <span className="text-sm">Selectează {title}</span>
        <div
          className="flex flex-wrap gap-3"
          data-testid={dataTestId}
        >
          {filteredOptions.map((v) => {
            const colorValue = colorMap[v]
            const hexCodes = parseColorValue(colorValue)
            const hasValidColor = hexCodes.length > 0
            const isSelected = v === current
            const isAvailable = availableValues.has(v)
            const isUnavailable = !isAvailable

            if (hasValidColor) {
              // Render color swatch (supports single and composed colors)
              return (
                <button
                  onClick={() => {
                    if (isUnavailable) return
                    // Toggle: deselect if already selected, otherwise select
                    updateOption(option.id, isSelected ? "" : v)
                  }}
                  key={v}
                  className={clx(
                    "relative w-10 h-10 rounded-full border-2 transition-all duration-150 overflow-hidden",
                    {
                      "border-ui-border-interactive ring-2 ring-ui-border-interactive ring-offset-2":
                        isSelected && !isUnavailable,
                      "border-ui-border-base hover:border-ui-border-strong hover:scale-110":
                        !isSelected && !isUnavailable && !disabled,
                      "opacity-50 cursor-not-allowed": disabled,
                      "cursor-not-allowed": isUnavailable,
                    }
                  )}
                  disabled={disabled || isUnavailable}
                  data-testid="option-button"
                  title={isUnavailable ? `${v} - indisponibil` : v}
                  aria-label={isUnavailable ? `${v} indisponibil` : `Selecteaza ${v}`}
                >
                  <ColorSwatch hexCodes={hexCodes} size="w-full h-full" />
                  {isUnavailable && <UnavailableOverlay />}
                </button>
              )
            }

            // Fallback to text button if no valid hex color
            return (
              <button
                onClick={() => {
                  if (isUnavailable) return
                  updateOption(option.id, isSelected ? "" : v)
                }}
                key={v}
                className={clx(
                  "relative border-ui-border-base bg-ui-bg-subtle border text-small-regular h-10 rounded-rounded p-2 flex-1 min-w-[60px]",
                  {
                    "border-ui-border-interactive": isSelected && !isUnavailable,
                    "hover:shadow-elevation-card-rest transition-shadow ease-in-out duration-150":
                      !isSelected && !isUnavailable && !disabled,
                    "opacity-50 cursor-not-allowed": isUnavailable,
                  }
                )}
                disabled={disabled || isUnavailable}
                data-testid="option-button"
              >
                {v}
                {isUnavailable && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {current && colorMap[current] && (
          <span className="text-xs text-ui-fg-muted">
            Selectată: {current}
          </span>
        )}
      </div>
    )
  }

  // Default text-based option buttons
  return (
    <div className="flex flex-col gap-y-3">
      <span className="text-sm">Selectează {title}</span>
      <div
        className="flex flex-wrap justify-between gap-2"
        data-testid={dataTestId}
      >
        {filteredOptions.map((v) => {
          const isSelected = v === current
          const isAvailable = availableValues.has(v)
          const isUnavailable = !isAvailable

          return (
            <button
              onClick={() => {
                if (isUnavailable) return
                updateOption(option.id, isSelected ? "" : v)
              }}
              key={v}
              className={clx(
                "relative border-ui-border-base bg-ui-bg-subtle border text-small-regular h-10 rounded-rounded p-2 flex-1",
                {
                  "border-ui-border-interactive": isSelected && !isUnavailable,
                  "hover:shadow-elevation-card-rest transition-shadow ease-in-out duration-150":
                    !isSelected && !isUnavailable && !disabled,
                  "opacity-50 cursor-not-allowed text-ui-fg-muted": isUnavailable,
                }
              )}
              disabled={disabled || isUnavailable}
              data-testid="option-button"
              title={isUnavailable ? `${v} - indisponibil` : undefined}
            >
              {v}
              {isUnavailable && (
                <span className="absolute inset-0 flex items-center justify-center bg-white/40 rounded-rounded">
                  <svg
                    className="w-4 h-4 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect
