import { notFound } from "next/navigation"
import { Suspense } from "react"

import InteractiveLink from "@modules/common/components/interactive-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import Breadcrumbs from "@modules/common/components/breadcrumbs"
import { HttpTypes } from "@medusajs/types"

export default function CategoryTemplate({
  category,
  countryCode,
}: {
  category: HttpTypes.StoreProductCategory
  countryCode: string
}) {
  if (!category || !countryCode) notFound()

  const parents = [] as HttpTypes.StoreProductCategory[]

  const getParents = (category: HttpTypes.StoreProductCategory) => {
    if (category.parent_category) {
      parents.push(category.parent_category)
      getParents(category.parent_category)
    }
  }

  getParents(category)

  return (
    <div
      className="py-6 content-container"
      data-testid="category-container"
    >
      <Breadcrumbs
        items={[
          { label: "Toate produsele", href: "/store" },
          ...[...parents].reverse().map((p) => ({
            label: p.name,
            href: `/categories/${p.handle}`,
          })),
          { label: category.name },
        ]}
        className="mb-6"
      />
      <div className="flex flex-row mb-8 text-2xl-semi gap-4">
        <h1 data-testid="category-page-title">{category.name}</h1>
      </div>
      {category.description && (
        <div className="mb-8 text-base-regular">
          <p>{category.description}</p>
        </div>
      )}
      {category.category_children && category.category_children.length > 0 && (
        <div className="mb-8 text-base-large">
          <ul className="grid grid-cols-1 gap-2">
            {category.category_children?.map((c) => (
              <li key={c.id}>
                <InteractiveLink href={`/categories/${c.handle}`}>
                  {c.name}
                </InteractiveLink>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Suspense
        fallback={
          <SkeletonProductGrid
            numberOfProducts={category.products?.length ?? 8}
          />
        }
      >
        <PaginatedProducts
          categoryId={category.id}
          countryCode={countryCode}
        />
      </Suspense>
    </div>
  )
}
