import { Metadata } from "next"
import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import LorikamProducts from "@modules/lorikam/templates/lorikam-products"

export const metadata: Metadata = {
  title: "Lorikam Shop",
  description: "Descopera produsele brandului Lorikam - articole sportive de calitate.",
}

type Params = {
  params: Promise<{
    countryCode: string
  }>
}

export default async function LorikamPage(props: Params) {
  const params = await props.params

  return (
    <div
      className="py-6 content-container"
      data-testid="lorikam-container"
    >
      <div className="mb-8">
        <h1 className="text-2xl-semi" data-testid="lorikam-page-title">
          Lorikam Shop
        </h1>
        <p className="text-ui-fg-subtle mt-2">
          Articole sportive de calitate pentru performanta ta.
        </p>
      </div>
      <Suspense fallback={<SkeletonProductGrid />}>
        <LorikamProducts countryCode={params.countryCode} />
      </Suspense>
    </div>
  )
}
