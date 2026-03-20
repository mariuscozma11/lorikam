import { Suspense } from "react"
import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { listColors } from "@lib/data/colors"
import FilteredProductsView from "@modules/store/components/product-filters/filtered-products-view"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
}

export default async function PaginatedProducts({
  collectionId,
  categoryId,
  productsIds,
  countryCode,
}: {
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
}) {
  const queryParams: PaginatedProductsParams = {
    limit: 100, // Fetch more products for client-side filtering
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  if (categoryId) {
    queryParams["category_id"] = [categoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // Fetch products and colors in parallel
  const [productsResult, colors] = await Promise.all([
    listProductsWithSort({
      page: 1,
      queryParams,
      countryCode,
    }),
    listColors(),
  ])

  const products = productsResult.response.products

  if (products.length === 0) {
    return (
      <p className="text-ui-fg-subtle">
        Nu exista produse in aceasta categorie momentan.
      </p>
    )
  }

  return (
    <Suspense fallback={<SkeletonProductGrid />}>
      <FilteredProductsView
        products={products}
        region={region}
        colors={colors}
        showTeams={false}
      />
    </Suspense>
  )
}
