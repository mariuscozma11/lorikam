import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { HttpTypes } from "@medusajs/types"

export default function CollectionTemplate({
  collection,
  countryCode,
}: {
  collection: HttpTypes.StoreCollection
  countryCode: string
}) {
  return (
    <div className="py-6 content-container">
      <div className="mb-8 text-2xl-semi">
        <h1>{collection.title}</h1>
      </div>
      <Suspense
        fallback={
          <SkeletonProductGrid
            numberOfProducts={collection.products?.length}
          />
        }
      >
        <PaginatedProducts
          collectionId={collection.id}
          countryCode={countryCode}
        />
      </Suspense>
    </div>
  )
}
