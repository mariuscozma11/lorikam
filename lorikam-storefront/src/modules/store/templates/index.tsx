import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = ({
  countryCode,
}: {
  countryCode: string
}) => {
  return (
    <div
      className="py-6 content-container"
      data-testid="category-container"
    >
      <div className="mb-8 text-2xl-semi">
        <h1 data-testid="store-page-title">All products</h1>
      </div>
      <Suspense fallback={<SkeletonProductGrid />}>
        <PaginatedProducts countryCode={countryCode} />
      </Suspense>
    </div>
  )
}

export default StoreTemplate
