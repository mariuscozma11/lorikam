"use client"

import { useMemo } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import {
  parseFiltersFromParams,
  filterProducts,
  sortProducts,
} from "@lib/util/filters"
import { Color } from "@lib/data/colors"
import { Team } from "@lib/data/teams"
import ProductFilters from "./index"
import ProductPreviewClient from "@modules/products/components/product-preview/product-preview-client"
import { Pagination } from "@modules/store/components/pagination"

const PRODUCTS_PER_PAGE = 12

type FilteredProductsViewProps = {
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
  colors?: Color[]
  teams?: Team[]
  showTeams?: boolean
}

/**
 * Extract color IDs that are actually used by products
 */
function getUsedColorIds(products: HttpTypes.StoreProduct[]): Set<string> {
  const usedColorIds = new Set<string>()

  for (const product of products) {
    // Check color_map in metadata (primary method)
    const colorMap = (product.metadata as any)?.color_map as
      | Record<string, any>
      | undefined
    if (colorMap) {
      Object.keys(colorMap).forEach((colorId) => usedColorIds.add(colorId))
    }

    // Check for linked colors via module link (if expanded with +color)
    const linkedColors = (product as any).color
    if (Array.isArray(linkedColors)) {
      linkedColors.forEach((color: any) => {
        if (color?.id) usedColorIds.add(color.id)
      })
    } else if (linkedColors?.id) {
      usedColorIds.add(linkedColors.id)
    }
  }

  return usedColorIds
}

export default function FilteredProductsView({
  products,
  region,
  colors = [],
  teams = [],
  showTeams = false,
}: FilteredProductsViewProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Parse filters from URL
  const filters = useMemo(
    () => parseFiltersFromParams(searchParams),
    [searchParams]
  )

  // Filter colors to only show those used by products
  const availableColors = useMemo(() => {
    const usedColorIds = getUsedColorIds(products)
    return colors.filter((color) => usedColorIds.has(color.id))
  }, [colors, products])

  // Apply filters and sorting
  const filteredAndSortedProducts = useMemo(() => {
    const filtered = filterProducts(products, filters)
    return sortProducts(filtered, filters.sortBy)
  }, [products, filters])

  // Pagination
  const currentPage = filters.page || 1
  const totalPages = Math.ceil(
    filteredAndSortedProducts.length / PRODUCTS_PER_PAGE
  )
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE
  const paginatedProducts = filteredAndSortedProducts.slice(
    startIndex,
    startIndex + PRODUCTS_PER_PAGE
  )

  // Handle page change
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (page > 1) {
      params.set("page", page.toString())
    } else {
      params.delete("page")
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex flex-col small:flex-row small:items-start gap-6">
      {/* Filters Sidebar */}
      <ProductFilters
        products={products}
        colors={availableColors}
        teams={teams}
        showTeams={showTeams}
        className="small:pr-6"
      />

      {/* Products Grid */}
      <div className="w-full">
        {/* Results count */}
        <div className="mb-4 text-sm text-ui-fg-subtle">
          {filteredAndSortedProducts.length === 0 ? (
            "Nu s-au gasit produse"
          ) : filteredAndSortedProducts.length === 1 ? (
            "1 produs gasit"
          ) : (
            `${filteredAndSortedProducts.length} produse gasite`
          )}
        </div>

        {paginatedProducts.length > 0 ? (
          <>
            <ul
              className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
              data-testid="products-list"
            >
              {paginatedProducts.map((p) => (
                <li key={p.id}>
                  <ProductPreviewClient product={p} region={region} />
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  data-testid="product-pagination"
                  page={currentPage}
                  totalPages={totalPages}
                />
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center text-ui-fg-subtle">
            <p>Nu s-au gasit produse care sa corespunda filtrelor selectate.</p>
            <button
              type="button"
              onClick={() => router.push(pathname)}
              className="mt-4 text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
            >
              Sterge toate filtrele
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
