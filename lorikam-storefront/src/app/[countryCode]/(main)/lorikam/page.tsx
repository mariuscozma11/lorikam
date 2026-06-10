import { Metadata } from "next"
import { Suspense } from "react"
import Image from "next/image"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import LorikamProducts from "@modules/lorikam/templates/lorikam-products"
import Breadcrumbs from "@modules/common/components/breadcrumbs"

export const metadata: Metadata = {
  title: "Lorikam Shop",
  description: "Descoperă produsele brandului Lorikam - articole sportive de calitate.",
}

type Params = {
  params: Promise<{
    countryCode: string
  }>
}

export default async function LorikamPage(props: Params) {
  const params = await props.params

  return (
    <div data-testid="lorikam-container">
      {/* Banner */}
      <div className="relative w-full aspect-[1600/731] overflow-hidden">
        <Image
          src="/lorikam-shop.jpeg"
          alt="Lorikam Shop"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-contain"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1
            className="text-white text-3xl small:text-5xl font-semibold"
            data-testid="lorikam-page-title"
          >
            Lorikam Shop
          </h1>
          <p className="text-white/90 mt-3 max-w-2xl text-base small:text-lg">
            Articole sportive de calitate pentru performanța ta.
          </p>
        </div>
      </div>

      <div className="py-6 content-container">
        <Breadcrumbs items={[{ label: "Lorikam Shop" }]} className="mb-6" />
        <Suspense fallback={<SkeletonProductGrid />}>
          <LorikamProducts countryCode={params.countryCode} />
        </Suspense>
      </div>
    </div>
  )
}
