"use client"

import { useCallback, useEffect, useState } from "react"
import FilterSection from "./filter-section"

type PriceRangeFilterProps = {
  min: number
  max: number
  currentMin?: number
  currentMax?: number
  onChange: (min: number | undefined, max: number | undefined) => void
  currency?: string
}

export default function PriceRangeFilter({
  min,
  max,
  currentMin,
  currentMax,
  onChange,
  currency = "RON",
}: PriceRangeFilterProps) {
  const [localMin, setLocalMin] = useState<string>(
    currentMin?.toString() ?? ""
  )
  const [localMax, setLocalMax] = useState<string>(
    currentMax?.toString() ?? ""
  )
  const [sliderMin, setSliderMin] = useState(currentMin ?? min)
  const [sliderMax, setSliderMax] = useState(currentMax ?? max)

  // Sync with external values
  useEffect(() => {
    setLocalMin(currentMin?.toString() ?? "")
    setLocalMax(currentMax?.toString() ?? "")
    setSliderMin(currentMin ?? min)
    setSliderMax(currentMax ?? max)
  }, [currentMin, currentMax, min, max])

  const handleMinInputChange = useCallback(
    (value: string) => {
      setLocalMin(value)
      const num = parseFloat(value)
      if (!isNaN(num) && num >= min && num <= sliderMax) {
        setSliderMin(num)
      }
    },
    [min, sliderMax]
  )

  const handleMaxInputChange = useCallback(
    (value: string) => {
      setLocalMax(value)
      const num = parseFloat(value)
      if (!isNaN(num) && num <= max && num >= sliderMin) {
        setSliderMax(num)
      }
    },
    [max, sliderMin]
  )

  const handleInputBlur = useCallback(() => {
    const minVal = localMin ? parseFloat(localMin) : undefined
    const maxVal = localMax ? parseFloat(localMax) : undefined

    const validMin =
      minVal !== undefined && !isNaN(minVal) && minVal >= min
        ? Math.min(minVal, maxVal ?? max)
        : undefined

    const validMax =
      maxVal !== undefined && !isNaN(maxVal) && maxVal <= max
        ? Math.max(maxVal, validMin ?? min)
        : undefined

    onChange(validMin, validMax)
  }, [localMin, localMax, min, max, onChange])

  const handleSliderMinChange = useCallback(
    (value: number) => {
      const newMin = Math.min(value, sliderMax - 1)
      setSliderMin(newMin)
      setLocalMin(newMin.toString())
    },
    [sliderMax]
  )

  const handleSliderMaxChange = useCallback(
    (value: number) => {
      const newMax = Math.max(value, sliderMin + 1)
      setSliderMax(newMax)
      setLocalMax(newMax.toString())
    },
    [sliderMin]
  )

  const handleSliderCommit = useCallback(() => {
    const minVal = sliderMin > min ? sliderMin : undefined
    const maxVal = sliderMax < max ? sliderMax : undefined
    onChange(minVal, maxVal)
  }, [sliderMin, sliderMax, min, max, onChange])

  const range = max - min || 1
  const minPercent = ((sliderMin - min) / range) * 100
  const maxPercent = ((sliderMax - min) / range) * 100

  return (
    <FilterSection title="Pret">
      <div className="space-y-4">
        {/* Dual Range Slider */}
        <div className="relative h-6 px-2">
          {/* Track background */}
          <div className="absolute top-1/2 left-2 right-2 h-1 -translate-y-1/2 rounded-full bg-ui-bg-subtle" />

          {/* Active track */}
          <div
            className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-ui-fg-base"
            style={{
              left: `calc(${minPercent}% + 8px)`,
              right: `calc(${100 - maxPercent}% + 8px)`,
            }}
          />

          {/* Min slider */}
          <input
            type="range"
            min={min}
            max={max}
            value={sliderMin}
            onChange={(e) => handleSliderMinChange(parseInt(e.target.value))}
            onMouseUp={handleSliderCommit}
            onTouchEnd={handleSliderCommit}
            className="absolute top-0 left-0 w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ui-fg-base [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-ui-fg-base [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
            style={{ zIndex: sliderMin > max - 10 ? 5 : 3 }}
          />

          {/* Max slider */}
          <input
            type="range"
            min={min}
            max={max}
            value={sliderMax}
            onChange={(e) => handleSliderMaxChange(parseInt(e.target.value))}
            onMouseUp={handleSliderCommit}
            onTouchEnd={handleSliderCommit}
            className="absolute top-0 left-0 w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ui-fg-base [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-ui-fg-base [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
            style={{ zIndex: 4 }}
          />
        </div>

        {/* Input fields */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="sr-only">Pret minim</label>
            <div className="relative">
              <input
                type="number"
                placeholder={min.toString()}
                value={localMin}
                onChange={(e) => handleMinInputChange(e.target.value)}
                onBlur={handleInputBlur}
                onKeyDown={(e) => e.key === "Enter" && handleInputBlur()}
                min={min}
                max={max}
                className="w-full rounded-md border border-ui-border-base bg-ui-bg-field pl-3 pr-12 py-2 text-sm text-ui-fg-base placeholder:text-ui-fg-muted focus:border-ui-border-interactive focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ui-fg-muted pointer-events-none">
                {currency}
              </span>
            </div>
          </div>
          <span className="text-ui-fg-muted">-</span>
          <div className="flex-1">
            <label className="sr-only">Pret maxim</label>
            <div className="relative">
              <input
                type="number"
                placeholder={max.toString()}
                value={localMax}
                onChange={(e) => handleMaxInputChange(e.target.value)}
                onBlur={handleInputBlur}
                onKeyDown={(e) => e.key === "Enter" && handleInputBlur()}
                min={min}
                max={max}
                className="w-full rounded-md border border-ui-border-base bg-ui-bg-field pl-3 pr-12 py-2 text-sm text-ui-fg-base placeholder:text-ui-fg-muted focus:border-ui-border-interactive focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ui-fg-muted pointer-events-none">
                {currency}
              </span>
            </div>
          </div>
        </div>
      </div>
    </FilterSection>
  )
}
