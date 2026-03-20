"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import { ChevronDown, XMark } from "@medusajs/icons"
import {
  ProductFilters as ProductFiltersType,
  SortOption,
  parseFiltersFromParams,
  buildFilterParams,
  getPriceRange,
  extractProductOptions,
  extractCategories,
} from "@lib/util/filters"
import { Color } from "@lib/data/colors"
import { Team } from "@lib/data/teams"
import SortFilter from "./sort-filter"
import PriceRangeFilter from "./price-range-filter"
import ColorFilter from "./color-filter"
import CategoryFilter from "./category-filter"
import TeamFilter from "./team-filter"
import DynamicOptionFilters from "./dynamic-option-filters"

type ProductFiltersProps = {
  products: HttpTypes.StoreProduct[]
  colors?: Color[]
  teams?: Team[]
  showTeams?: boolean
  className?: string
}

export default function ProductFilters({
  products,
  colors = [],
  teams = [],
  showTeams = false,
  className,
}: ProductFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Parse current filters from URL
  const filters = useMemo(
    () => parseFiltersFromParams(searchParams),
    [searchParams]
  )

  // Extract available filter values from products
  const priceRange = useMemo(() => getPriceRange(products), [products])
  const productOptions = useMemo(
    () => extractProductOptions(products),
    [products]
  )
  const categories = useMemo(() => extractCategories(products), [products])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++
    if (filters.colors && filters.colors.length > 0) count++
    if (filters.categories && filters.categories.length > 0) count++
    if (filters.teams && filters.teams.length > 0) count++
    if (filters.options) {
      count += Object.keys(filters.options).length
    }
    return count
  }, [filters])

  // Update URL with new filters
  const updateFilters = useCallback(
    (newFilters: Partial<ProductFiltersType>) => {
      const updatedFilters: ProductFiltersType = {
        ...filters,
        ...newFilters,
        // Reset to page 1 when filters change (except for sort)
        page: newFilters.page !== undefined ? newFilters.page : 1,
      }

      const params = buildFilterParams(updatedFilters)
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [filters, pathname, router]
  )

  // Clear all filters
  const clearFilters = useCallback(() => {
    const params = new URLSearchParams()
    if (filters.sortBy) {
      params.set("sortBy", filters.sortBy)
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [filters.sortBy, pathname, router])

  // Handlers for each filter type
  const handleSortChange = useCallback(
    (sort: SortOption) => {
      updateFilters({ sortBy: sort })
    },
    [updateFilters]
  )

  const handlePriceChange = useCallback(
    (min: number | undefined, max: number | undefined) => {
      updateFilters({ minPrice: min, maxPrice: max })
    },
    [updateFilters]
  )

  const handleColorsChange = useCallback(
    (colorIds: string[]) => {
      updateFilters({ colors: colorIds.length > 0 ? colorIds : undefined })
    },
    [updateFilters]
  )

  const handleCategoriesChange = useCallback(
    (categoryIds: string[]) => {
      updateFilters({
        categories: categoryIds.length > 0 ? categoryIds : undefined,
      })
    },
    [updateFilters]
  )

  const handleTeamsChange = useCallback(
    (teamHandles: string[]) => {
      updateFilters({ teams: teamHandles.length > 0 ? teamHandles : undefined })
    },
    [updateFilters]
  )

  const handleOptionsChange = useCallback(
    (options: Record<string, string[]>) => {
      updateFilters({
        options: Object.keys(options).length > 0 ? options : undefined,
      })
    },
    [updateFilters]
  )

  const filtersContent = (
    <div className="space-y-0">
      {/* Sort */}
      <SortFilter sortBy={filters.sortBy} onChange={handleSortChange} />

      {/* Price Range */}
      <PriceRangeFilter
        min={priceRange.min}
        max={priceRange.max}
        currentMin={filters.minPrice}
        currentMax={filters.maxPrice}
        onChange={handlePriceChange}
      />

      {/* Colors */}
      {colors.length > 0 && (
        <ColorFilter
          colors={colors}
          selectedColors={filters.colors || []}
          onChange={handleColorsChange}
        />
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <CategoryFilter
          categories={categories}
          selectedCategories={filters.categories || []}
          onChange={handleCategoriesChange}
        />
      )}

      {/* Teams (only on fan shop) */}
      {showTeams && teams.length > 0 && (
        <TeamFilter
          teams={teams}
          selectedTeams={filters.teams || []}
          onChange={handleTeamsChange}
        />
      )}

      {/* Dynamic Option Filters */}
      <DynamicOptionFilters
        options={productOptions}
        selectedOptions={filters.options || {}}
        onChange={handleOptionsChange}
      />
    </div>
  )

  return (
    <div className={clx("w-full small:w-[280px] small:min-w-[280px]", className)}>
      {/* Mobile: Collapsible */}
      <div className="small:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center justify-between w-full py-3 px-4 mb-4 bg-ui-bg-subtle rounded-lg"
        >
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-ui-fg-base">Filtre</span>
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 text-xs font-medium bg-ui-fg-base text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <ChevronDown
            className={clx(
              "w-5 h-5 transition-transform duration-200",
              mobileOpen && "rotate-180"
            )}
          />
        </button>

        <div
          className={clx(
            "overflow-hidden transition-all duration-300",
            mobileOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          {activeFilterCount > 0 && (
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-ui-fg-subtle hover:text-ui-fg-base transition-colors"
              >
                <XMark className="w-4 h-4" />
                Sterge filtrele
              </button>
            </div>
          )}
          {filtersContent}
        </div>
      </div>

      {/* Desktop: Always visible */}
      <div className="hidden small:block sticky top-24">
        {/* Header with clear button */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-ui-fg-base">Filtre</h3>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-ui-fg-subtle hover:text-ui-fg-base transition-colors"
            >
              <XMark className="w-4 h-4" />
              Sterge ({activeFilterCount})
            </button>
          )}
        </div>

        {filtersContent}
      </div>
    </div>
  )
}
