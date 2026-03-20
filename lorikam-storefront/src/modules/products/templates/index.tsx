import React, { Suspense } from "react"

import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import ProductDisplay from "@modules/products/components/product-display"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import MarkdownContent from "@modules/common/components/markdown-content"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <>
      {/* Main Product Section - 2 column layout */}
      <div
        className="content-container py-6"
        data-testid="product-container"
      >
        <ProductDisplay product={product} region={region}>
          <ProductOnboardingCta />
        </ProductDisplay>

        {/* Description Section */}
        {product.description && (
          <div className="mt-12 pt-8 border-t border-ui-border-base">
            <MarkdownContent
              content={product.description}
              className="max-w-3xl"
            />
          </div>
        )}

      </div>

      {/* Related Products */}
      <div
        className="content-container my-16 small:my-32"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
