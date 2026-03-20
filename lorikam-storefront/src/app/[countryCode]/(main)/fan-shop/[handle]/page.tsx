import { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { getTeamByHandle, getTeams } from "@lib/data/teams"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import TeamProducts from "@modules/fan-shop/templates/team-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Params = {
  params: Promise<{
    countryCode: string
    handle: string
  }>
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const params = await props.params
  const team = await getTeamByHandle(params.handle)

  if (!team) {
    return {
      title: "Echipa nu a fost gasita",
    }
  }

  return {
    title: `${team.name} - Fan Shop`,
    description: team.description || `Echipamentele oficiale ${team.name}.`,
  }
}

export async function generateStaticParams() {
  const teams = await getTeams()
  return teams.map((team) => ({
    handle: team.handle,
  }))
}

export default async function TeamPage(props: Params) {
  const params = await props.params

  const team = await getTeamByHandle(params.handle)

  if (!team) {
    notFound()
  }

  return (
    <div>
      {/* Team Header Banner */}
      <div
        className="relative overflow-hidden"
        style={{
          background: team.banner_image
            ? `url(${team.banner_image}) center/cover`
            : team.primary_color || "#1f2937",
          minHeight: "200px",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: team.banner_image
              ? "linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7))"
              : "transparent",
          }}
        />
        <div className="relative content-container py-12">
          <LocalizedClientLink
            href="/fan-shop"
            className="text-sm mb-4 inline-block hover:underline"
            style={{
              color: team.banner_image
                ? "rgba(255,255,255,0.8)"
                : team.secondary_color || "#fff",
            }}
          >
            &larr; Toate echipele
          </LocalizedClientLink>
          <div className="flex items-center gap-6">
            {team.logo && (
              <img
                src={team.logo}
                alt={team.name}
                className="w-24 h-24 object-contain rounded-lg bg-white p-3 shadow-lg"
              />
            )}
            <div>
              <h1
                className="text-3xl font-bold"
                style={{
                  color: team.banner_image
                    ? "white"
                    : team.secondary_color || "#fff",
                }}
              >
                {team.name}
              </h1>
              {team.description && (
                <p
                  className="mt-2 max-w-2xl"
                  style={{
                    color: team.banner_image
                      ? "rgba(255,255,255,0.8)"
                      : team.secondary_color || "rgba(255,255,255,0.8)",
                  }}
                >
                  {team.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div
        className="py-6 content-container"
        data-testid="team-products-container"
      >
        <div className="mb-8">
          <h2 className="text-xl-semi">Produse {team.name}</h2>
        </div>
        <Suspense fallback={<SkeletonProductGrid />}>
          <TeamProducts
            teamHandle={params.handle}
            countryCode={params.countryCode}
          />
        </Suspense>
      </div>
    </div>
  )
}
