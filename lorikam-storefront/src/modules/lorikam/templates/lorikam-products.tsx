import { Suspense } from "react"
import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { getLinkedProductIds } from "@lib/data/teams"
import { listColors } from "@lib/data/colors"
import FilteredProductsView from "@modules/store/components/product-filters/filtered-products-view"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"

export default async function LorikamProducts({
  countryCode,
}: {
  countryCode: string
}) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // Fetch all data in parallel
  const [linkedProductIds, productsResult, colors] = await Promise.all([
    getLinkedProductIds(),
    listProductsWithSort({
      page: 1,
      queryParams: { limit: 100 },
      countryCode,
    }),
    listColors(),
  ])

  // Filter out products that are linked to teams
  const linkedSet = new Set(linkedProductIds)
  const lorikamProducts = productsResult.response.products.filter(
    (p) => !linkedSet.has(p.id)
  )

  if (lorikamProducts.length === 0) {
    return (
      <p className="text-ui-fg-subtle">
        Nu exista produse in Lorikam Shop momentan.
      </p>
    )
  }

  return (
    <Suspense fallback={<SkeletonProductGrid />}>
      <FilteredProductsView
        products={lorikamProducts}
        region={region}
        colors={colors}
        showTeams={false}
      />
    </Suspense>
  )
}
