"use client"

import { clx } from "@medusajs/ui"
import FilterSection from "./filter-section"
import { SortOption } from "@lib/util/filters"

type SortFilterProps = {
  sortBy?: SortOption
  onChange: (sort: SortOption) => void
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "created_at", label: "Cele mai noi" },
  { value: "price_asc", label: "Pret: Mic → Mare" },
  { value: "price_desc", label: "Pret: Mare → Mic" },
  { value: "title_asc", label: "Nume: A → Z" },
  { value: "title_desc", label: "Nume: Z → A" },
]

export default function SortFilter({ sortBy, onChange }: SortFilterProps) {
  const currentSort = sortBy || "created_at"

  return (
    <FilterSection title="Sorteaza dupa" defaultOpen={true}>
      <div className="space-y-2">
        {sortOptions.map((option) => {
          const isSelected = currentSort === option.value
          return (
            <label
              key={option.value}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div
                className={clx(
                  "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                  isSelected
                    ? "border-ui-fg-base"
                    : "border-ui-border-base group-hover:border-ui-fg-muted"
                )}
              >
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-ui-fg-base" />
                )}
              </div>
              <input
                type="radio"
                name="sortBy"
                value={option.value}
                checked={isSelected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span
                className={clx(
                  "text-sm transition-colors",
                  isSelected ? "text-ui-fg-base" : "text-ui-fg-subtle"
                )}
              >
                {option.label}
              </span>
            </label>
          )
        })}
      </div>
    </FilterSection>
  )
}
