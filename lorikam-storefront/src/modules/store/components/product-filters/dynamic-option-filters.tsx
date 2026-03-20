"use client"

import { useCallback } from "react"
import { clx } from "@medusajs/ui"
import FilterSection from "./filter-section"

type ProductOption = {
  id: string
  title: string
  values: string[]
}

type DynamicOptionFiltersProps = {
  options: Record<string, ProductOption>
  selectedOptions: Record<string, string[]>
  onChange: (options: Record<string, string[]>) => void
}

function OptionFilter({
  option,
  selectedValues,
  onToggle,
}: {
  option: ProductOption
  selectedValues: string[]
  onToggle: (value: string) => void
}) {
  return (
    <FilterSection title={option.title}>
      <div className="space-y-2">
        {option.values.map((value) => {
          const isSelected = selectedValues.includes(value)
          return (
            <label
              key={value}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div
                className={clx(
                  "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                  isSelected
                    ? "bg-ui-fg-base border-ui-fg-base"
                    : "border-ui-border-base bg-ui-bg-base group-hover:border-ui-fg-muted"
                )}
              >
                {isSelected && (
                  <svg
                    className="w-3 h-3 text-white"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M2.5 6L5 8.5L9.5 3.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(value)}
                className="sr-only"
              />
              <span
                className={clx(
                  "text-sm transition-colors",
                  isSelected ? "text-ui-fg-base" : "text-ui-fg-subtle"
                )}
              >
                {value}
              </span>
            </label>
          )
        })}
      </div>
    </FilterSection>
  )
}

export default function DynamicOptionFilters({
  options,
  selectedOptions,
  onChange,
}: DynamicOptionFiltersProps) {
  const handleToggle = useCallback(
    (optionId: string, value: string) => {
      const currentValues = selectedOptions[optionId] || []
      let newValues: string[]

      if (currentValues.includes(value)) {
        newValues = currentValues.filter((v) => v !== value)
      } else {
        newValues = [...currentValues, value]
      }

      const newOptions = { ...selectedOptions }
      if (newValues.length > 0) {
        newOptions[optionId] = newValues
      } else {
        delete newOptions[optionId]
      }

      onChange(newOptions)
    },
    [selectedOptions, onChange]
  )

  const optionsList = Object.values(options)

  if (optionsList.length === 0) {
    return null
  }

  return (
    <>
      {optionsList.map((option) => (
        <OptionFilter
          key={option.id}
          option={option}
          selectedValues={selectedOptions[option.id] || []}
          onToggle={(value) => handleToggle(option.id, value)}
        />
      ))}
    </>
  )
}
