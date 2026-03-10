import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import React from "react"

type ColorMap = Record<string, string>

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  colorMap?: ColorMap
  "data-testid"?: string
}

const isColorOption = (title: string): boolean => {
  const normalized = title.toLowerCase()
  return normalized === "culoare" || normalized === "culori"
}

const isValidHex = (str: string): boolean => {
  return /^#([0-9A-Fa-f]{3}){1,2}$/.test(str)
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
  colorMap,
}) => {
  const filteredOptions = (option.values ?? []).map((v) => v.value)
  const isColor = isColorOption(title)

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
            const hexColor = colorMap[v]
            const hasValidColor = hexColor && isValidHex(hexColor)
            const isSelected = v === current

            if (hasValidColor) {
              // Render color swatch
              return (
                <button
                  onClick={() => updateOption(option.id, v)}
                  key={v}
                  className={clx(
                    "relative w-10 h-10 rounded-full border-2 transition-all duration-150",
                    {
                      "border-ui-border-interactive ring-2 ring-ui-border-interactive ring-offset-2":
                        isSelected,
                      "border-ui-border-base hover:border-ui-border-strong hover:scale-110":
                        !isSelected,
                      "opacity-50 cursor-not-allowed": disabled,
                    }
                  )}
                  style={{ backgroundColor: hexColor }}
                  disabled={disabled}
                  data-testid="option-button"
                  title={v}
                  aria-label={`Selecteaza ${v}`}
                />
              )
            }

            // Fallback to text button if no valid hex color
            return (
              <button
                onClick={() => updateOption(option.id, v)}
                key={v}
                className={clx(
                  "border-ui-border-base bg-ui-bg-subtle border text-small-regular h-10 rounded-rounded p-2 flex-1 min-w-[60px]",
                  {
                    "border-ui-border-interactive": isSelected,
                    "hover:shadow-elevation-card-rest transition-shadow ease-in-out duration-150":
                      !isSelected,
                  }
                )}
                disabled={disabled}
                data-testid="option-button"
              >
                {v}
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
          return (
            <button
              onClick={() => updateOption(option.id, v)}
              key={v}
              className={clx(
                "border-ui-border-base bg-ui-bg-subtle border text-small-regular h-10 rounded-rounded p-2 flex-1 ",
                {
                  "border-ui-border-interactive": v === current,
                  "hover:shadow-elevation-card-rest transition-shadow ease-in-out duration-150":
                    v !== current,
                }
              )}
              disabled={disabled}
              data-testid="option-button"
            >
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect
