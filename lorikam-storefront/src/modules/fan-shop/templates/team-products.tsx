import { Suspense } from "react"
import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { getTeamProductIds } from "@lib/data/teams"
import { listColors } from "@lib/data/colors"
import FilteredProductsView from "@modules/store/components/product-filters/filtered-products-view"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"

export default async function TeamProducts({
  teamHandle,
  countryCode,
}: {
  teamHandle: string
  countryCode: string
}) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // Get IDs of products linked to this team
  const teamProductIds = await getTeamProductIds(teamHandle)

  if (teamProductIds.length === 0) {
    return (
      <p className="text-ui-fg-subtle">
        Nu exista produse pentru aceasta echipa momentan.
      </p>
    )
  }

  // Fetch products and colors in parallel
  const [productsResult, colors] = await Promise.all([
    listProductsWithSort({
      page: 1,
      queryParams: {
        id: teamProductIds,
        limit: 100,
      },
      countryCode,
    }),
    listColors(),
  ])

  const allProducts = productsResult.response.products

  if (allProducts.length === 0) {
    return (
      <p className="text-ui-fg-subtle">
        Nu exista produse pentru aceasta echipa momentan.
      </p>
    )
  }

  return (
    <Suspense fallback={<SkeletonProductGrid />}>
      <FilteredProductsView
        products={allProducts}
        region={region}
        colors={colors}
        showTeams={false}
      />
    </Suspense>
  )
}
