"use client"

import { useCallback } from "react"
import { clx } from "@medusajs/ui"
import FilterSection from "./filter-section"

type Category = {
  id: string
  name: string
  handle: string
}

type CategoryFilterProps = {
  categories: Category[]
  selectedCategories: string[]
  onChange: (categories: string[]) => void
}

export default function CategoryFilter({
  categories,
  selectedCategories,
  onChange,
}: CategoryFilterProps) {
  const handleToggle = useCallback(
    (categoryId: string) => {
      if (selectedCategories.includes(categoryId)) {
        onChange(selectedCategories.filter((id) => id !== categoryId))
      } else {
        onChange([...selectedCategories, categoryId])
      }
    },
    [selectedCategories, onChange]
  )

  if (categories.length === 0) {
    return null
  }

  return (
    <FilterSection title="Categorie">
      <div className="space-y-2">
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category.id)
          return (
            <label
              key={category.id}
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
                onChange={() => handleToggle(category.id)}
                className="sr-only"
              />
              <span
                className={clx(
                  "text-sm transition-colors",
                  isSelected ? "text-ui-fg-base" : "text-ui-fg-subtle"
                )}
              >
                {category.name}
              </span>
            </label>
          )
        })}
      </div>
    </FilterSection>
  )
}
