import { Metadata } from "next"
import { Suspense } from "react"

import { getTeams } from "@lib/data/teams"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import AllFanShopProducts from "@modules/fan-shop/templates/all-fan-shop-products"

export const metadata: Metadata = {
  title: "Fan Shop",
  description: "Echipamentele oficiale ale echipelor partenere.",
}

type Params = {
  params: Promise<{
    countryCode: string
  }>
}

export default async function FanShopPage(props: Params) {
  const params = await props.params

  const teams = await getTeams()

  return (
    <div className="content-container py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl-semi">Fan Shop</h1>
        <p className="text-ui-fg-subtle mt-2">
          Echipamentele oficiale ale echipelor partenere. Alege echipa ta favorita!
        </p>
      </div>

      {/* Teams Grid */}
      {teams.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl-semi mb-6">Echipe Partenere</h2>
          <div className="grid grid-cols-1 small:grid-cols-2 medium:grid-cols-3 gap-6">
            {teams.map((team) => (
              <LocalizedClientLink
                key={team.id}
                href={`/fan-shop/${team.handle}`}
                className="group block"
              >
                <div
                  className="relative overflow-hidden rounded-lg border border-ui-border-base hover:border-ui-border-strong transition-colors"
                  style={{
                    background: team.banner_image
                      ? `url(${team.banner_image}) center/cover`
                      : team.primary_color || "#f3f4f6",
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background: team.banner_image
                        ? "linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.6))"
                        : "transparent",
                    }}
                  />
                  <div className="relative p-6 min-h-[200px] flex flex-col justify-end">
                    <div className="flex items-center gap-4">
                      {team.logo && (
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="w-16 h-16 object-contain rounded bg-white p-2"
                        />
                      )}
                      <div>
                        <h2
                          className="text-xl font-semibold"
                          style={{
                            color: team.banner_image
                              ? "white"
                              : team.secondary_color || "#000",
                          }}
                        >
                          {team.name}
                        </h2>
                        {team.description && (
                          <p
                            className="text-sm mt-1 line-clamp-2"
                            style={{
                              color: team.banner_image
                                ? "rgba(255,255,255,0.8)"
                                : team.secondary_color || "#666",
                            }}
                          >
                            {team.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </LocalizedClientLink>
            ))}
          </div>
        </div>
      )}

      {/* All Products Section */}
      <div className="border-t border-ui-border-base pt-8">
        <h2 className="text-xl-semi mb-6">Toate Produsele Fan Shop</h2>
        <Suspense fallback={<SkeletonProductGrid />}>
          <AllFanShopProducts countryCode={params.countryCode} />
        </Suspense>
      </div>
    </div>
  )
}
