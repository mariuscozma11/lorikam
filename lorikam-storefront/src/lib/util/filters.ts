import { HttpTypes } from "@medusajs/types"

export type SortOption =
  | "price_asc"
  | "price_desc"
  | "created_at"
  | "title_asc"
  | "title_desc"

export type ProductFilters = {
  sortBy?: SortOption
  minPrice?: number
  maxPrice?: number
  colors?: string[]
  teams?: string[]
  categories?: string[]
  // Dynamic variant options: opt_[optionId] = [value1, value2]
  options?: Record<string, string[]>
  page?: number
}

/**
 * Parse filters from URL search params
 */
export function parseFiltersFromParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): ProductFilters {
  const params =
    searchParams instanceof URLSearchParams
      ? Object.fromEntries(searchParams.entries())
      : searchParams

  const filters: ProductFilters = {}

  // Sort
  if (params.sortBy) {
    filters.sortBy = params.sortBy as SortOption
  }

  // Price range
  if (params.minPrice) {
    const min = parseFloat(params.minPrice as string)
    if (!isNaN(min)) filters.minPrice = min
  }
  if (params.maxPrice) {
    const max = parseFloat(params.maxPrice as string)
    if (!isNaN(max)) filters.maxPrice = max
  }

  // Colors (comma-separated)
  if (params.colors) {
    const colorsParam = params.colors as string
    filters.colors = colorsParam.split(",").filter(Boolean)
  }

  // Teams (comma-separated)
  if (params.teams) {
    const teamsParam = params.teams as string
    filters.teams = teamsParam.split(",").filter(Boolean)
  }

  // Categories (comma-separated)
  if (params.categories) {
    const categoriesParam = params.categories as string
    filters.categories = categoriesParam.split(",").filter(Boolean)
  }

  // Dynamic options (opt_[optionId]=value1,value2)
  const options: Record<string, string[]> = {}
  Object.keys(params).forEach((key) => {
    if (key.startsWith("opt_")) {
      const optionId = key.replace("opt_", "")
      const values = (params[key] as string).split(",").filter(Boolean)
      if (values.length > 0) {
        options[optionId] = values
      }
    }
  })
  if (Object.keys(options).length > 0) {
    filters.options = options
  }

  // Page
  if (params.page) {
    const page = parseInt(params.page as string, 10)
    if (!isNaN(page) && page > 0) filters.page = page
  }

  return filters
}

/**
 * Build URL search params from filters
 */
export function buildFilterParams(filters: ProductFilters): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.sortBy) {
    params.set("sortBy", filters.sortBy)
  }

  if (filters.minPrice !== undefined) {
    params.set("minPrice", filters.minPrice.toString())
  }

  if (filters.maxPrice !== undefined) {
    params.set("maxPrice", filters.maxPrice.toString())
  }

  if (filters.colors && filters.colors.length > 0) {
    params.set("colors", filters.colors.join(","))
  }

  if (filters.teams && filters.teams.length > 0) {
    params.set("teams", filters.teams.join(","))
  }

  if (filters.categories && filters.categories.length > 0) {
    params.set("categories", filters.categories.join(","))
  }

  if (filters.options) {
    Object.entries(filters.options).forEach(([optionId, values]) => {
      if (values.length > 0) {
        params.set(`opt_${optionId}`, values.join(","))
      }
    })
  }

  if (filters.page && filters.page > 1) {
    params.set("page", filters.page.toString())
  }

  return params
}

/**
 * Get the calculated price from a product (lowest variant price)
 */
function getProductPrice(product: HttpTypes.StoreProduct): number | null {
  if (!product.variants || product.variants.length === 0) {
    return null
  }

  let lowestPrice: number | null = null

  for (const variant of product.variants) {
    const price = variant.calculated_price?.calculated_amount
    if (price !== undefined && price !== null) {
      if (lowestPrice === null || price < lowestPrice) {
        lowestPrice = price
      }
    }
  }

  return lowestPrice
}

/**
 * Check if product matches color filter
 */
function matchesColorFilter(
  product: HttpTypes.StoreProduct,
  colorIds: string[]
): boolean {
  if (colorIds.length === 0) return true

  // Check color_map in metadata (primary method)
  const colorMap = (product.metadata as any)?.color_map as
    | Record<string, any>
    | undefined
  if (colorMap) {
    const productColorIds = Object.keys(colorMap)
    if (colorIds.some((colorId) => productColorIds.includes(colorId))) {
      return true
    }
  }

  // Check for linked colors via module link (if expanded with +color)
  const linkedColors = (product as any).color
  if (Array.isArray(linkedColors)) {
    const linkedColorIds = linkedColors.map((c: any) => c?.id).filter(Boolean)
    if (colorIds.some((colorId) => linkedColorIds.includes(colorId))) {
      return true
    }
  } else if (linkedColors?.id && colorIds.includes(linkedColors.id)) {
    return true
  }

  // Fallback: check variant options for "Culoare" option
  const colorOption = product.options?.find(
    (opt) => opt.title?.toLowerCase() === "culoare"
  )
  if (colorOption && product.variants) {
    for (const variant of product.variants) {
      const colorValue = variant.options?.find(
        (opt) => opt.option_id === colorOption.id
      )?.value
      if (colorValue && colorIds.includes(colorValue)) {
        return true
      }
    }
  }

  return false
}

/**
 * Check if product matches category filter
 */
function matchesCategoryFilter(
  product: HttpTypes.StoreProduct,
  categoryIds: string[]
): boolean {
  if (categoryIds.length === 0) return true

  const productCategories = product.categories || []
  return productCategories.some((cat) => categoryIds.includes(cat.id))
}

/**
 * Check if product matches dynamic option filters
 */
function matchesOptionFilters(
  product: HttpTypes.StoreProduct,
  optionFilters: Record<string, string[]>
): boolean {
  if (Object.keys(optionFilters).length === 0) return true

  // For each option filter, at least one variant must match
  for (const [optionId, values] of Object.entries(optionFilters)) {
    let hasMatch = false

    if (product.variants) {
      for (const variant of product.variants) {
        const variantOption = variant.options?.find(
          (opt) => opt.option_id === optionId
        )
        if (variantOption && values.includes(variantOption.value)) {
          hasMatch = true
          break
        }
      }
    }

    if (!hasMatch) return false
  }

  return true
}

/**
 * Filter products based on filter criteria
 */
export function filterProducts(
  products: HttpTypes.StoreProduct[],
  filters: ProductFilters
): HttpTypes.StoreProduct[] {
  return products.filter((product) => {
    // Price filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const price = getProductPrice(product)
      if (price === null) return false

      if (filters.minPrice !== undefined && price < filters.minPrice) {
        return false
      }
      if (filters.maxPrice !== undefined && price > filters.maxPrice) {
        return false
      }
    }

    // Color filter
    if (filters.colors && filters.colors.length > 0) {
      if (!matchesColorFilter(product, filters.colors)) {
        return false
      }
    }

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      if (!matchesCategoryFilter(product, filters.categories)) {
        return false
      }
    }

    // Dynamic option filters
    if (filters.options && Object.keys(filters.options).length > 0) {
      if (!matchesOptionFilters(product, filters.options)) {
        return false
      }
    }

    return true
  })
}

/**
 * Sort products based on sort option
 */
export function sortProducts(
  products: HttpTypes.StoreProduct[],
  sortBy?: SortOption
): HttpTypes.StoreProduct[] {
  if (!sortBy) return products

  const sorted = [...products]

  switch (sortBy) {
    case "price_asc":
      sorted.sort((a, b) => {
        const priceA = getProductPrice(a) ?? Infinity
        const priceB = getProductPrice(b) ?? Infinity
        return priceA - priceB
      })
      break

    case "price_desc":
      sorted.sort((a, b) => {
        const priceA = getProductPrice(a) ?? -Infinity
        const priceB = getProductPrice(b) ?? -Infinity
        return priceB - priceA
      })
      break

    case "created_at":
      sorted.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateB - dateA
      })
      break

    case "title_asc":
      sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""))
      break

    case "title_desc":
      sorted.sort((a, b) => (b.title || "").localeCompare(a.title || ""))
      break
  }

  return sorted
}

/**
 * Extract price range from products
 */
export function getPriceRange(products: HttpTypes.StoreProduct[]): {
  min: number
  max: number
} {
  let min = Infinity
  let max = -Infinity

  for (const product of products) {
    const price = getProductPrice(product)
    if (price !== null && price > 0) {
      if (price < min) min = price
      if (price > max) max = price
    }
  }

  // Handle edge cases
  if (min === Infinity) min = 0
  if (max === -Infinity) max = 1000

  return { min: Math.floor(min), max: Math.ceil(max) }
}

/**
 * Extract unique option values from products
 * Excludes "Culoare" option which has dedicated filter
 */
export function extractProductOptions(
  products: HttpTypes.StoreProduct[]
): Record<string, { id: string; title: string; values: string[] }> {
  const optionsMap: Record<
    string,
    { id: string; title: string; values: Set<string> }
  > = {}

  for (const product of products) {
    if (!product.options) continue

    for (const option of product.options) {
      // Skip color option
      if (option.title?.toLowerCase() === "culoare") continue

      if (!optionsMap[option.id]) {
        optionsMap[option.id] = {
          id: option.id,
          title: option.title || option.id,
          values: new Set(),
        }
      }

      // Get values from option.values if available
      if (option.values) {
        for (const val of option.values) {
          optionsMap[option.id].values.add(val.value)
        }
      }

      // Also get values from variants
      if (product.variants) {
        for (const variant of product.variants) {
          const variantOption = variant.options?.find(
            (opt) => opt.option_id === option.id
          )
          if (variantOption?.value) {
            optionsMap[option.id].values.add(variantOption.value)
          }
        }
      }
    }
  }

  // Convert Sets to arrays
  const result: Record<string, { id: string; title: string; values: string[] }> =
    {}
  for (const [id, data] of Object.entries(optionsMap)) {
    if (data.values.size > 0) {
      result[id] = {
        id: data.id,
        title: data.title,
        values: Array.from(data.values).sort(),
      }
    }
  }

  return result
}

/**
 * Extract unique categories from products
 */
export function extractCategories(
  products: HttpTypes.StoreProduct[]
): { id: string; name: string; handle: string }[] {
  const categoriesMap = new Map<
    string,
    { id: string; name: string; handle: string }
  >()

  for (const product of products) {
    if (!product.categories) continue

    for (const category of product.categories) {
      if (!categoriesMap.has(category.id)) {
        categoriesMap.set(category.id, {
          id: category.id,
          name: category.name || category.handle || category.id,
          handle: category.handle || category.id,
        })
      }
    }
  }

  return Array.from(categoriesMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  )
}
