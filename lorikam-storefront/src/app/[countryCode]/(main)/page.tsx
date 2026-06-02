import { Metadata } from "next"
import { Suspense } from "react"

import Hero from "@modules/home/components/hero"
import FeatureHighlights from "@modules/home/components/feature-highlights"
import LatestProducts from "@modules/home/components/latest-products"
import PromoCards from "@modules/home/components/promo-cards"
import AboutTeaser from "@modules/home/components/about-teaser"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"

export const metadata: Metadata = {
  title: "Lorikam - Articole sportive de calitate",
  description:
    "Magazin online de articole sportive și echipamente oficiale ale echipelor partenere.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params

  return (
    <>
      <Hero />
      <FeatureHighlights />
      <PromoCards />
      <Suspense
        fallback={
          <div className="content-container py-12">
            <SkeletonProductGrid />
          </div>
        }
      >
        <LatestProducts countryCode={countryCode} />
      </Suspense>
      <AboutTeaser />
    </>
  )
}
