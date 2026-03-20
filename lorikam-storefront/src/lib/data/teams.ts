"use server"

import { sdk } from "@lib/config"

export type Team = {
  id: string
  name: string
  handle: string
  logo: string | null
  primary_color: string | null
  secondary_color: string | null
  description: string | null
  banner_image: string | null
}

export type TeamsResponse = {
  teams: Team[]
}

export type TeamResponse = {
  team: Team & {
    products?: any[]
  }
}

export type TeamProductsResponse = {
  product_ids?: string[]
  linked_product_ids?: string[]
}

export async function getTeams(): Promise<Team[]> {
  try {
    const response = await sdk.client.fetch<TeamsResponse>("/store/teams", {
      cache: "no-store",
    })
    return response?.teams || []
  } catch (error: any) {
    // Silently return empty array if teams endpoint is not available
    // This happens when backend is not running or teams module not set up
    if (error?.status === 404 || error?.message?.includes("Not Found")) {
      return []
    }
    console.error("Failed to fetch teams:", error)
    return []
  }
}

export async function getTeamByHandle(handle: string): Promise<Team | null> {
  try {
    const response = await sdk.client.fetch<TeamResponse>(`/store/teams/${handle}`)
    return response.team || null
  } catch (error) {
    console.error(`Failed to fetch team ${handle}:`, error)
    return null
  }
}

export async function getTeamProductIds(teamHandle: string): Promise<string[]> {
  try {
    const response = await sdk.client.fetch<TeamProductsResponse>(
      `/store/teams/products`,
      {
        query: { team_handle: teamHandle },
      }
    )
    return response.product_ids || []
  } catch (error) {
    console.error(`Failed to fetch products for team ${teamHandle}:`, error)
    return []
  }
}

export async function getLinkedProductIds(): Promise<string[]> {
  try {
    const response = await sdk.client.fetch<TeamProductsResponse>(
      `/store/teams/products`,
      {
        query: { no_team: "true" },
      }
    )
    return response.linked_product_ids || []
  } catch (error) {
    console.error("Failed to fetch linked product IDs:", error)
    return []
  }
}
