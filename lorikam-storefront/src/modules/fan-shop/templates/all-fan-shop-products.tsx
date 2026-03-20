import { Suspense } from "react"
import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { getLinkedProductIds, getTeams } from "@lib/data/teams"
import { listColors } from "@lib/data/colors"
import FilteredProductsView from "@modules/store/components/product-filters/filtered-products-view"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"

export default async function AllFanShopProducts({
  countryCode,
}: {
  countryCode: string
}) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // Get IDs of products linked to teams (fan shop products)
  const linkedProductIds = await getLinkedProductIds()

  if (linkedProductIds.length === 0) {
    return (
      <p className="text-ui-fg-subtle">
        Nu exista produse Fan Shop momentan.
      </p>
    )
  }

  // Fetch all products, colors, and teams in parallel
  const [productsResult, colors, teams] = await Promise.all([
    listProductsWithSort({
      page: 1,
      queryParams: {
        id: linkedProductIds,
        limit: 100,
      },
      countryCode,
    }),
    listColors(),
    getTeams(),
  ])

  const allProducts = productsResult.response.products

  if (allProducts.length === 0) {
    return (
      <p className="text-ui-fg-subtle">
        Nu exista produse Fan Shop momentan.
      </p>
    )
  }

  return (
    <Suspense fallback={<SkeletonProductGrid />}>
      <FilteredProductsView
        products={allProducts}
        region={region}
        colors={colors}
        teams={teams}
        showTeams={true}
      />
    </Suspense>
  )
}
