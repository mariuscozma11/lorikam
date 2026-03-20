"use server"

import { sdk } from "@lib/config"

export type Color = {
  id: string
  name: string
  hex_codes: string[]
  display_order: number
}

export type ColorsResponse = {
  colors: Color[]
}

export async function listColors(): Promise<Color[]> {
  const response = await sdk.client.fetch<ColorsResponse>("/store/colors", {
    method: "GET",
    cache: "force-cache",
    next: {
      revalidate: 3600, // Cache for 1 hour
    },
  })

  return response.colors || []
}
